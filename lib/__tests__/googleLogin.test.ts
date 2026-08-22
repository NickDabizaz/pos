import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import type { Mailer } from "@/lib/server/mailer/types";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

/** Mailer no-op — mencegah signUpEmail (sendOnSignUp) mencoba SMTP sungguhan di test ini,
 * yang fokusnya login Google, bukan alur email. */
const noopMailer: Mailer = { send: async () => {} };

const SESSION_COOKIE_NAME = "better-auth.session_token";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;
let auth: ReturnType<typeof createAuth>;

type FakeGoogleProfile = {
  sub          : string;
  email        : string;
  name         : string;
  emailVerified?: boolean;
};

/** Menyandikan profil Google palsu jadi "idToken" — dibaca balik oleh `getUserInfo` palsu di
 * bawah, supaya tiap test bisa mengontrol profil yang dikembalikan tanpa memanggil Google
 * sungguhan (lihat catatan seam tiket 06). */
function fakeIdToken(profile: FakeGoogleProfile): string {
  return JSON.stringify(profile);
}

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
  auth = createAuth(prisma, {
    mailer        : noopMailer,
    googleProvider: {
      verifyIdToken: async (token) => token !== "DITOLAK_PENGGUNA",
      getUserInfo   : async (token) => {
        if (!token.idToken || token.idToken === "GAGAL_TUKAR_TOKEN") {
          return null;
        }
        const profile: FakeGoogleProfile = JSON.parse(token.idToken);
        return {
          user: {
            name         : profile.name,
            email        : profile.email,
            emailVerified: profile.emailVerified ?? true,
          },
          data: {
            sub           : profile.sub,
            email         : profile.email,
            email_verified: profile.emailVerified ?? true,
            name          : profile.name,
            given_name    : profile.name,
            family_name   : profile.name,
            picture       : "",
            aud           : "fake-google-client-id",
            azp           : "fake-google-client-id",
            iss           : "https://accounts.google.com",
            iat           : Math.floor(Date.now() / 1000),
            exp           : Math.floor(Date.now() / 1000) + 3600,
          },
        };
      },
    },
  });
}, 60_000);

afterAll(async () => {
  await tearDown();
});

function sessionHeadersFrom(headers: Headers): Headers {
  const sessionCookie = parseSetCookieHeader(headers.get("set-cookie") ?? "").get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    throw new Error("Response tidak memuat cookie sesi");
  }
  return new Headers({ cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` });
}

async function signInGoogle(profile: FakeGoogleProfile) {
  return auth.api.signInSocial({
    body: { provider: "google", idToken: { token: fakeIdToken(profile) } },
  });
}

describe("Pengguna dapat mendaftar dan masuk lewat Google", () => {
  it('masuk dengan akun Google beremail "citra@gmail.com" yang belum pernah terdaftar membuat satu Pengguna baru beserta satu baris account dengan providerId "google"', async () => {
    await signInGoogle({ sub: "google-citra", email: "citra@gmail.com", name: "Citra" });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "citra@gmail.com" } });
    const accounts = await prisma.account.findMany({ where: { iduser: user.id } });

    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe("google");
  });

  it("Google mengembalikan error/consent ditolak: tidak ada Pengguna, account, atau session yang tercipta", async () => {
    const before = await prisma.user.count();

    await expect(
      auth.api.signInSocial({ body: { provider: "google", idToken: { token: "DITOLAK_PENGGUNA" } } }),
    ).rejects.toBeDefined();

    const after = await prisma.user.count();
    expect(after).toBe(before);
  });

  it("Pengguna menutup alur sebelum tukar token selesai: tidak ada baris account yatim yang tertinggal", async () => {
    const beforeUsers = await prisma.user.count();
    const beforeAccounts = await prisma.account.count();

    await expect(
      auth.api.signInSocial({ body: { provider: "google", idToken: { token: "GAGAL_TUKAR_TOKEN" } } }),
    ).rejects.toBeDefined();

    expect(await prisma.user.count()).toBe(beforeUsers);
    expect(await prisma.account.count()).toBe(beforeAccounts);
  });

  it("dua percobaan login Google pertama kali dengan email baru yang sama dikirim bersamaan hanya menghasilkan satu Pengguna", async () => {
    const profile: FakeGoogleProfile = { sub: "google-bersamaan", email: "bersamaan@gmail.com", name: "Bersamaan" };

    await Promise.allSettled([signInGoogle(profile), signInGoogle(profile)]);

    const users = await prisma.user.findMany({ where: { email: "bersamaan@gmail.com" } });
    expect(users).toHaveLength(1);
  });
});

describe("Akun Google dengan email yang sama tertaut ke Pengguna yang sudah ada, bukan membuat duplikat", () => {
  async function registerAndVerifyEmailPassword(email: string): Promise<void> {
    await auth.api.signUpEmail({ body: { email, password: "RahasiaAman123", name: email } });
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  }

  it('Pengguna "dedi@toko.id" yang sudah punya akun email+password, lalu masuk lewat Google dengan email yang sama, mendapat baris account baru providerId "google" yang menunjuk ke iduser yang sama, tanpa baris user baru', async () => {
    await registerAndVerifyEmailPassword("dedi@toko.id");
    const userSebelum = await prisma.user.findUniqueOrThrow({ where: { email: "dedi@toko.id" } });

    await signInGoogle({ sub: "google-dedi", email: "dedi@toko.id", name: "Dedi" });

    const users = await prisma.user.findMany({ where: { email: "dedi@toko.id" } });
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(userSebelum.id);

    const accounts = await prisma.account.findMany({ where: { iduser: userSebelum.id } });
    expect(accounts.map((account) => account.providerId).sort()).toEqual(["credential", "google"]);
  });

  it("setelah tertaut, baris account email+password yang lama tetap ada dan tetap bisa dipakai login biasa", async () => {
    await registerAndVerifyEmailPassword("tetap-bisa-login@toko.id");

    await signInGoogle({ sub: "google-tetap-bisa-login", email: "tetap-bisa-login@toko.id", name: "Tetap" });

    const result = await auth.api.signInEmail({
      body: { email: "tetap-bisa-login@toko.id", password: "RahasiaAman123" },
    });
    expect(result.user.email).toBe("tetap-bisa-login@toko.id");
  });

  it("pendaftaran email+password dan login Google pertama kali dengan email baru yang identik dikirim bersamaan hanya menghasilkan satu Pengguna", async () => {
    const email = "bersamaan-daftar@toko.id";

    await Promise.allSettled([
      auth.api.signUpEmail({ body: { email, password: "RahasiaAman123", name: email } }),
      signInGoogle({ sub: "google-bersamaan-daftar", email, name: "Bersamaan Daftar" }),
    ]);

    const users = await prisma.user.findMany({ where: { email } });
    expect(users).toHaveLength(1);
  });
});

describe("Pengguna yang masuk lewat Google mendapat sesi yang sama perilakunya dengan login biasa", () => {
  it("sesi hasil login Google memiliki bentuk field yang sama seperti sesi hasil login email+password", async () => {
    await auth.api.signUpEmail({ body: { email: "sesi-biasa@toko.id", password: "RahasiaAman123", name: "Sesi Biasa" } });
    const { headers: emailHeaders } = await auth.api.signInEmail({
      body        : { email: "sesi-biasa@toko.id", password: "RahasiaAman123" },
      returnHeaders: true,
    });
    const emailSession = await auth.api.getSession({ headers: sessionHeadersFrom(emailHeaders) });

    const { headers: googleHeaders } = await auth.api.signInSocial({
      body         : { provider: "google", idToken: { token: fakeIdToken({ sub: "google-sesi", email: "sesi-google@gmail.com", name: "Sesi Google" }) } },
      returnHeaders: true,
    });
    const googleSession = await auth.api.getSession({ headers: sessionHeadersFrom(googleHeaders) });

    expect(Object.keys(googleSession!.session).sort()).toEqual(Object.keys(emailSession!.session).sort());
    expect(Object.keys(googleSession!.user).sort()).toEqual(Object.keys(emailSession!.user).sort());
  });

  it("sesi hasil login Google mengikuti masa berlaku (expiresAt) yang sama seperti sesi biasa", async () => {
    await auth.api.signUpEmail({ body: { email: "masaberlaku@toko.id", password: "RahasiaAman123", name: "Masa Berlaku" } });
    const { headers: emailHeaders } = await auth.api.signInEmail({
      body        : { email: "masaberlaku@toko.id", password: "RahasiaAman123" },
      returnHeaders: true,
    });
    const emailSession = await auth.api.getSession({ headers: sessionHeadersFrom(emailHeaders) });

    const { headers: googleHeaders } = await auth.api.signInSocial({
      body         : { provider: "google", idToken: { token: fakeIdToken({ sub: "google-masaberlaku", email: "masaberlaku-google@gmail.com", name: "Masa Berlaku Google" }) } },
      returnHeaders: true,
    });
    const googleSession = await auth.api.getSession({ headers: sessionHeadersFrom(googleHeaders) });

    const emailDurasiMs = emailSession!.session.expiresAt.getTime() - emailSession!.session.createdAt.getTime();
    const googleDurasiMs = googleSession!.session.expiresAt.getTime() - googleSession!.session.createdAt.getTime();
    expect(googleDurasiMs).toBe(emailDurasiMs);
  });
});
