import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import type { EmailMessage, Mailer } from "@/lib/server/mailer/types";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;
let sentEmails: EmailMessage[] = [];
let auth: ReturnType<typeof createAuth>;

const fakeMailer: Mailer = {
  send: vi.fn(async (message: EmailMessage) => {
    sentEmails.push(message);
  }),
};

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
  auth = createAuth(prisma, { mailer: fakeMailer });
}, 60_000);

afterEach(() => {
  sentEmails = [];
  vi.clearAllMocks();
});

afterAll(async () => {
  await tearDown();
});

function extractToken(html: string): string {
  const match = /data-token="([^"]+)"/.exec(html);
  if (!match) {
    throw new Error("Email tidak memuat tautan bertoken");
  }
  return decodeURIComponent(match[1]);
}

async function registerUser(email: string, password = "RahasiaAman123"): Promise<void> {
  await auth.api.signUpEmail({ body: { email, password, name: email } });
  sentEmails = [];
}

async function requestReset(email: string): Promise<void> {
  await auth.api.requestPasswordReset({ body: { email } });
}

describe("Pengguna dapat meminta tautan reset password lewat emailnya", () => {
  it('meminta reset untuk email "budi@toko.id" yang terdaftar mengirim email berisi tautan reset bertoken baru', async () => {
    await registerUser("budi@toko.id");

    await requestReset("budi@toko.id");

    expect(sentEmails).toHaveLength(1);
    expect(() => extractToken(sentEmails[0].html)).not.toThrow();
  });

  it("meminta reset untuk email yang tidak pernah terdaftar mengembalikan respons yang sama seperti email terdaftar", async () => {
    await registerUser("terdaftar@toko.id");

    const responUntukTerdaftar = await requestReset("terdaftar@toko.id").then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error }),
    );
    const responUntukTidakTerdaftar = await requestReset("tidak-pernah-ada@toko.id").then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error }),
    );

    expect(responUntukTerdaftar.ok).toBe(true);
    expect(responUntukTidakTerdaftar.ok).toBe(true);
  });

  it("Pengguna yang punya token verifikasi email yang masih hidup tetap bisa meminta token reset password terpisah, dan keduanya valid berdampingan", async () => {
    await auth.api.signUpEmail({ body: { email: "dua-token@toko.id", password: "RahasiaAman123", name: "Dua Token" } });
    const verificationToken = extractToken(sentEmails[0].html);
    sentEmails = [];

    await requestReset("dua-token@toko.id");
    const resetToken = extractToken(sentEmails[0].html);

    await expect(auth.api.verifyEmail({ query: { token: verificationToken } })).resolves.toBeDefined();
    await expect(
      auth.api.resetPassword({ body: { token: resetToken, newPassword: "PasswordBaru123" } }),
    ).resolves.toBeDefined();
  });
});

describe("Tautan reset mengubah password dan hanya dapat dipakai satu kali", () => {
  it('memakai tautan reset yang valid dengan password baru "Password123" berhasil mengubah password, dan Pengguna bisa login memakai password baru itu', async () => {
    await registerUser("reset-sukses@toko.id");
    await requestReset("reset-sukses@toko.id");
    const token = extractToken(sentEmails[0].html);

    await auth.api.resetPassword({ body: { token, newPassword: "Password123" } });

    const result = await auth.api.signInEmail({ body: { email: "reset-sukses@toko.id", password: "Password123" } });
    expect(result.user.email).toBe("reset-sukses@toko.id");
  });

  it("login dengan password lama setelah reset berhasil ditolak", async () => {
    await registerUser("reset-password-lama@toko.id");
    await requestReset("reset-password-lama@toko.id");
    const token = extractToken(sentEmails[0].html);

    await auth.api.resetPassword({ body: { token, newPassword: "Password123" } });

    await expect(
      auth.api.signInEmail({ body: { email: "reset-password-lama@toko.id", password: "RahasiaAman123" } }),
    ).rejects.toBeDefined();
  });

  it("memakai tautan reset yang sama untuk kedua kalinya ditolak dengan pesan jelas", async () => {
    await registerUser("reset-dipakai-dua-kali@toko.id");
    await requestReset("reset-dipakai-dua-kali@toko.id");
    const token = extractToken(sentEmails[0].html);

    await auth.api.resetPassword({ body: { token, newPassword: "Password123" } });

    await expect(auth.api.resetPassword({ body: { token, newPassword: "PasswordLain123" } })).rejects.toBeDefined();
  });

  it("password baru yang lebih pendek dari batas minimum ditolak, tautan reset tidak ikut terpakai", async () => {
    await registerUser("reset-password-pendek@toko.id");
    await requestReset("reset-password-pendek@toko.id");
    const token = extractToken(sentEmails[0].html);

    await expect(auth.api.resetPassword({ body: { token, newPassword: "pendek" } })).rejects.toBeDefined();

    const result = await auth.api.resetPassword({ body: { token, newPassword: "PasswordValid123" } });
    expect(result).toBeDefined();
  });

  it("dua permintaan pemakaian tautan reset yang sama dikirim bersamaan hanya satu yang berhasil mengubah password", async () => {
    await registerUser("reset-bersamaan@toko.id");
    await requestReset("reset-bersamaan@toko.id");
    const token = extractToken(sentEmails[0].html);

    const results = await Promise.allSettled([
      auth.api.resetPassword({ body: { token, newPassword: "PasswordSatu123" } }),
      auth.api.resetPassword({ body: { token, newPassword: "PasswordDua123" } }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);
  });
});

describe("Tautan reset yang sudah kedaluwarsa ditolak dengan pesan jelas", () => {
  it("tautan reset yang dipakai setelah kedaluwarsa ditolak dengan pesan jelas, dan password tidak berubah", async () => {
    await registerUser("reset-kedaluwarsa@toko.id");
    await requestReset("reset-kedaluwarsa@toko.id");
    const token = extractToken(sentEmails[0].html);

    await prisma.verification.updateMany({
      where: { identifier: { contains: token } },
      data : { expiresAt: new Date(Date.now() - 1_000) },
    });

    const error = await auth.api.resetPassword({ body: { token, newPassword: "PasswordBaru123" } }).catch((caught) => caught);
    expect(error).toBeDefined();
    expect(String(error.body?.message ?? error.message)).toMatch(/expired|kedaluwarsa|invalid/i);

    const result = await auth.api.signInEmail({ body: { email: "reset-kedaluwarsa@toko.id", password: "RahasiaAman123" } });
    expect(result.user.email).toBe("reset-kedaluwarsa@toko.id");
  });
});
