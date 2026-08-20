import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

const SESSION_COOKIE_NAME = "better-auth.session_token";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
  auth = createAuth(prisma);
}, 60_000);

afterAll(async () => {
  await tearDown();
});

/** Mengambil cookie sesi dari header `set-cookie` sebuah response Better Auth. */
function sessionHeadersFrom(headers: Headers): Headers {
  const sessionCookie = parseSetCookieHeader(headers.get("set-cookie") ?? "").get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    throw new Error("Response tidak memuat cookie sesi");
  }
  return new Headers({ cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` });
}

async function registerUser(email: string, password: string) {
  const { headers } = await auth.api.signUpEmail({
    body: { email, password, name: email },
    returnHeaders: true,
  });
  return sessionHeadersFrom(headers);
}

describe("Mendaftar dengan email dan password langsung menghasilkan sesi aktif", () => {
  it('mendaftar dengan email "budi@norvyn.test" dan password "RahasiaAman123" berhasil membuat Pengguna baru di tabel user', async () => {
    await registerUser("budi@norvyn.test", "RahasiaAman123");

    const user = await prisma.user.findUnique({ where: { email: "budi@norvyn.test" } });
    expect(user).not.toBeNull();
  });

  it("getSession dengan sesi hasil registrasi mengembalikan Pengguna tanpa perlu signInEmail terpisah", async () => {
    const sessionHeaders = await registerUser("wati@norvyn.test", "RahasiaAman123");

    const session = await auth.api.getSession({ headers: sessionHeaders });

    expect(session?.user.email).toBe("wati@norvyn.test");
  });
});

describe("Mendaftar dengan email yang sudah terpakai ditolak dengan pesan yang jelas", () => {
  it('mendaftar kedua kalinya dengan email "duplikat@norvyn.test" yang sudah terdaftar ditolak dengan pesan yang menyebut email sudah dipakai', async () => {
    await registerUser("duplikat@norvyn.test", "RahasiaAman123");

    await expect(
      auth.api.signUpEmail({
        body: { email: "duplikat@norvyn.test", password: "LainAman123", name: "Duplikat Lain" },
      }),
    ).rejects.toMatchObject({
      body: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    });
  });

  it('mendaftar dengan email yang sama tapi beda kapitalisasi ("Duplikat@Norvyn.test") tetap ditolak sebagai duplikat', async () => {
    await registerUser("kapital@norvyn.test", "RahasiaAman123");

    await expect(
      auth.api.signUpEmail({
        body: { email: "Kapital@Norvyn.test", password: "LainAman123", name: "Kapital Lain" },
      }),
    ).rejects.toMatchObject({
      body: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    });

    const users = await prisma.user.findMany({ where: { email: "kapital@norvyn.test" } });
    expect(users).toHaveLength(1);
  });

  it('dua percobaan mendaftar dengan email baru yang identik ("citra@norvyn.test") dikirim bersamaan menghasilkan tepat satu Pengguna tersimpan', async () => {
    const results = await Promise.allSettled([
      auth.api.signUpEmail({ body: { email: "citra@norvyn.test", password: "RahasiaAman123", name: "Citra Satu" } }),
      auth.api.signUpEmail({ body: { email: "citra@norvyn.test", password: "RahasiaAman123", name: "Citra Dua" } }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const users = await prisma.user.findMany({ where: { email: "citra@norvyn.test" } });
    expect(users).toHaveLength(1);
  });
});

describe("Login dengan kredensial salah ditolak tanpa membocorkan mana yang keliru", () => {
  it('login dengan email terdaftar "salahpass@norvyn.test" dan password salah ditolak', async () => {
    await registerUser("salahpass@norvyn.test", "RahasiaAman123");

    await expect(
      auth.api.signInEmail({ body: { email: "salahpass@norvyn.test", password: "SalahPassword1" } }),
    ).rejects.toMatchObject({ status: "UNAUTHORIZED" });
  });

  it('login dengan email yang tidak pernah terdaftar "tidakada@norvyn.test" ditolak', async () => {
    await expect(
      auth.api.signInEmail({ body: { email: "tidakada@norvyn.test", password: "Apapun123" } }),
    ).rejects.toMatchObject({ status: "UNAUTHORIZED" });
  });

  it("pesan/kode error untuk password salah dan email tidak terdaftar identik", async () => {
    await registerUser("bandingkan@norvyn.test", "RahasiaAman123");

    const [wrongPasswordError, unknownEmailError] = await Promise.all([
      auth.api
        .signInEmail({ body: { email: "bandingkan@norvyn.test", password: "SalahPassword1" } })
        .catch((error) => error),
      auth.api
        .signInEmail({ body: { email: "belumdaftar@norvyn.test", password: "Apapun123" } })
        .catch((error) => error),
    ]);

    expect(wrongPasswordError.body?.code).toBe(unknownEmailError.body?.code);
    expect(wrongPasswordError.body?.message).toBe(unknownEmailError.body?.message);
  });

  it('login dengan email dan password yang benar berhasil, membuktikan penolakan di atas memang karena kredensial salah', async () => {
    await registerUser("kredensialbenar@norvyn.test", "RahasiaAman123");

    const result = await auth.api.signInEmail({
      body: { email: "kredensialbenar@norvyn.test", password: "RahasiaAman123" },
    });

    expect(result.user.email).toBe("kredensialbenar@norvyn.test");
  });
});

describe("Login dan logout, sesi bertahan antar reload halaman", () => {
  it("login dengan kredensial benar menghasilkan sesi yang tersimpan di tabel session", async () => {
    await registerUser("sesitersimpan@norvyn.test", "RahasiaAman123");

    const { headers } = await auth.api.signInEmail({
      body: { email: "sesitersimpan@norvyn.test", password: "RahasiaAman123" },
      returnHeaders: true,
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "sesitersimpan@norvyn.test" } });
    const sessions = await prisma.session.findMany({ where: { iduser: user.id } });
    expect(sessions.length).toBeGreaterThan(0);
    expect(headers.get("set-cookie")).toContain(SESSION_COOKIE_NAME);
  });

  it("getSession ulang dengan token sesi yang sama (mensimulasikan reload halaman) tetap mengembalikan Pengguna yang sama", async () => {
    const sessionHeaders = await registerUser("reload@norvyn.test", "RahasiaAman123");

    const first = await auth.api.getSession({ headers: sessionHeaders });
    const second = await auth.api.getSession({ headers: sessionHeaders });

    expect(first?.user.email).toBe("reload@norvyn.test");
    expect(second?.user.email).toBe("reload@norvyn.test");
  });

  it("logout menginvalidasi sesi tersebut, dan getSession sesudahnya tidak lagi mengembalikan Pengguna manapun", async () => {
    const sessionHeaders = await registerUser("logout@norvyn.test", "RahasiaAman123");

    await auth.api.signOut({ headers: sessionHeaders });
    const sessionAfterLogout = await auth.api.getSession({ headers: sessionHeaders });

    expect(sessionAfterLogout).toBeNull();
  });
});

describe("Password tidak pernah tersimpan dalam bentuk terbaca", () => {
  it('kolom password pada tabel account bukan string mentah dan tidak memuat password mentah sebagai substring', async () => {
    await registerUser("hashcheck@norvyn.test", "RahasiaAman123");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "hashcheck@norvyn.test" } });
    const account = await prisma.account.findFirstOrThrow({ where: { iduser: user.id } });

    expect(account.password).not.toBe("RahasiaAman123");
    expect(account.password ?? "").not.toContain("RahasiaAman123");
  });

  it("dua Pengguna berbeda yang mendaftar dengan password identik menghasilkan hash tersimpan yang berbeda", async () => {
    await registerUser("hashsatu@norvyn.test", "RahasiaAman123");
    await registerUser("hashdua@norvyn.test", "RahasiaAman123");

    const userSatu = await prisma.user.findUniqueOrThrow({ where: { email: "hashsatu@norvyn.test" } });
    const userDua = await prisma.user.findUniqueOrThrow({ where: { email: "hashdua@norvyn.test" } });
    const accountSatu = await prisma.account.findFirstOrThrow({ where: { iduser: userSatu.id } });
    const accountDua = await prisma.account.findFirstOrThrow({ where: { iduser: userDua.id } });

    expect(accountSatu.password).not.toBe(accountDua.password);
  });
});
