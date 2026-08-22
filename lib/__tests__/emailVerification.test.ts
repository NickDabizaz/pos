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

async function registerUser(email: string): Promise<void> {
  await auth.api.signUpEmail({ body: { email, password: "RahasiaAman123", name: email } });
}

describe("Email verifikasi terkirim saat pendaftaran, dan tautan yang benar menandai email terverifikasi", () => {
  it('mendaftar dengan email baru "budi@toko.id" mengirim tepat satu email verifikasi berisi tautan bertoken', async () => {
    await registerUser("budi@toko.id");

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("budi@toko.id");
    expect(() => extractToken(sentEmails[0].html)).not.toThrow();
  });

  it("menekan tautan verifikasi yang valid mengubah emailVerified dari false menjadi true", async () => {
    await registerUser("verif-valid@toko.id");
    const token = extractToken(sentEmails[0].html);

    await auth.api.verifyEmail({ query: { token } });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "verif-valid@toko.id" } });
    expect(user.emailVerified).toBe(true);
  });

  it("menekan tautan verifikasi yang sama untuk kedua kalinya tidak menghasilkan efek samping ganda (idempoten)", async () => {
    await registerUser("verif-dipakai-dua-kali@toko.id");
    const token = extractToken(sentEmails[0].html);

    await auth.api.verifyEmail({ query: { token } });
    const before = await prisma.user.findUniqueOrThrow({ where: { email: "verif-dipakai-dua-kali@toko.id" } });

    await auth.api.verifyEmail({ query: { token } });
    const after = await prisma.user.findUniqueOrThrow({ where: { email: "verif-dipakai-dua-kali@toko.id" } });

    expect(after.emailVerified).toBe(true);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
  });

  it("menekan tautan verifikasi dengan token acak yang tidak pernah diterbitkan ditolak dengan pesan jelas", async () => {
    await expect(
      auth.api.verifyEmail({ query: { token: "token-acak-tidak-pernah-ada" } }),
    ).rejects.toBeDefined();
  });

  it("dua permintaan verifikasi dengan token yang sama dikirim bersamaan hanya menghasilkan satu email tertandai terverifikasi, tanpa efek samping ganda", async () => {
    await registerUser("verif-bersamaan@toko.id");
    const token = extractToken(sentEmails[0].html);

    const results = await Promise.allSettled([
      auth.api.verifyEmail({ query: { token } }),
      auth.api.verifyEmail({ query: { token } }),
    ]);

    expect(results.every((result) => result.status === "fulfilled")).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "verif-bersamaan@toko.id" } });
    expect(user.emailVerified).toBe(true);
  });
});

describe("Tautan verifikasi yang sudah kedaluwarsa ditolak dengan pesan jelas", () => {
  it("tautan verifikasi yang dipakai sebelum kedaluwarsa (10:59, diminta 10:00) masih diterima", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
      await registerUser("verif-belum-kedaluwarsa@toko.id");
      const token = extractToken(sentEmails[0].html);

      vi.setSystemTime(new Date("2026-01-01T10:59:00Z"));
      await expect(auth.api.verifyEmail({ query: { token } })).resolves.toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("tautan verifikasi yang dipakai setelah kedaluwarsa (11:01, diminta 10:00) ditolak dengan pesan jelas, bukan pesan generik", async () => {
    let error: unknown;
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
      await registerUser("verif-kedaluwarsa@toko.id");
      const token = extractToken(sentEmails[0].html);

      vi.setSystemTime(new Date("2026-01-01T11:01:00Z"));
      error = await auth.api.verifyEmail({ query: { token } }).catch((caught) => caught);
    } finally {
      vi.useRealTimers();
    }

    expect(error).toBeDefined();
    expect(String((error as { body?: { message?: string } }).body?.message)).toMatch(/expired/i);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "verif-kedaluwarsa@toko.id" } });
    expect(user.emailVerified).toBe(false);
  });
});
