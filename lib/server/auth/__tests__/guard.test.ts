import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import {
  cekEmailTerverifikasi,
  resolveDaftarPerusahaanAccess,
  resolvePerusahaanAktifAccess,
  resolveSudahPunyaPerusahaanAccess,
} from "@/lib/server/auth/guard";
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

function sessionHeadersFrom(headers: Headers): Headers {
  const sessionCookie = parseSetCookieHeader(headers.get("set-cookie") ?? "").get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    throw new Error("Response tidak memuat cookie sesi");
  }
  return new Headers({ cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` });
}

async function signUpAndGetHeaders(email: string): Promise<{ headers: Headers; iduser: string }> {
  const { headers, response } = await auth.api.signUpEmail({
    body         : { email, name: email, password: "RahasiaAman123" },
    returnHeaders: true,
  });
  return { headers: sessionHeadersFrom(headers), iduser: response.user.id };
}

async function redirectTargetOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    throw new Error("Diharapkan melempar redirect, tapi tidak melempar apa pun");
  } catch (error) {
    const digest = (error as { digest?: string }).digest;
    if (!digest || !digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    return digest.split(";")[2];
  }
}

describe("Pengarahan setelah login", () => {
  it("Pengguna yang belum memiliki Keanggotaan diarahkan ke form pendaftaran Perusahaan (tidak melempar redirect)", async () => {
    const { headers } = await signUpAndGetHeaders("belum-punya-perusahaan@norvyn.test");

    const session = await resolveDaftarPerusahaanAccess(auth, prisma, headers);

    expect(session.user.email).toBe("belum-punya-perusahaan@norvyn.test");
  });

  it("Pengguna yang sudah memiliki Keanggotaan dengan Perusahaan aktif tidak diarahkan ke form pendaftaran (dilempar ke /)", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("sudah-punya-perusahaan@norvyn.test");
    const perusahaan = await prisma.perusahaan.create({
      data: { kodeperusahaan: "PSH-GUARD-1", namaperusahaan: "Toko Guard", namadatabase: "pos_test_guard_1", status: 1 },
    });
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });

    const target = await redirectTargetOf(resolveDaftarPerusahaanAccess(auth, prisma, headers));

    expect(target).toBe("/");
  });

  it("Pengguna yang sudah memiliki Keanggotaan dengan Perusahaan belum bayar diarahkan ke /subscription, bukan /", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("sudah-punya-perusahaan-belum-bayar@norvyn.test");
    const perusahaan = await prisma.perusahaan.create({
      data: { kodeperusahaan: "PSH-GUARD-1B", namaperusahaan: "Toko Guard Belum Bayar", namadatabase: "pos_test_guard_1b" },
    });
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });

    const target = await redirectTargetOf(resolveDaftarPerusahaanAccess(auth, prisma, headers));

    expect(target).toBe("/subscription");
  });

  it("permintaan tanpa sesi login diarahkan ke halaman login dan tidak pernah sampai ke pendaftaran Perusahaan", async () => {
    const target = await redirectTargetOf(resolveDaftarPerusahaanAccess(auth, prisma, new Headers()));

    expect(target).toBe("/login");
  });
});

describe("Pengarahan ke halaman yang mensyaratkan sudah punya Perusahaan (belum tentu aktif)", () => {
  it("Pengguna yang belum memiliki Keanggotaan diarahkan ke /daftar-perusahaan", async () => {
    const { headers } = await signUpAndGetHeaders("belum-punya-perusahaan-beranda@norvyn.test");

    const target = await redirectTargetOf(resolveSudahPunyaPerusahaanAccess(auth, prisma, headers));

    expect(target).toBe("/daftar-perusahaan");
  });

  it("Pengguna yang sudah memiliki Keanggotaan tidak diarahkan (tidak melempar redirect)", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("sudah-punya-perusahaan-beranda@norvyn.test");
    const perusahaan = await prisma.perusahaan.create({
      data: { kodeperusahaan: "PSH-GUARD-2", namaperusahaan: "Toko Guard Beranda", namadatabase: "pos_test_guard_2" },
    });
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });

    const session = await resolveSudahPunyaPerusahaanAccess(auth, prisma, headers);

    expect(session.user.email).toBe("sudah-punya-perusahaan-beranda@norvyn.test");
  });

  it("permintaan tanpa sesi login diarahkan ke halaman login, bukan ke /daftar-perusahaan", async () => {
    const target = await redirectTargetOf(resolveSudahPunyaPerusahaanAccess(auth, prisma, new Headers()));

    expect(target).toBe("/login");
  });
});

describe("Kebijakan Pengguna belum terverifikasi ditegakkan secara konsisten", () => {
  it("Pengguna dengan emailVerified = false yang mencoba aksi yang dijaga kebijakan ini ditolak dengan pesan jelas", async () => {
    const { headers } = await signUpAndGetHeaders("belum-verifikasi@norvyn.test");
    const session = await auth.api.getSession({ headers });

    expect(() => cekEmailTerverifikasi(session!)).toThrow("Email Anda belum terverifikasi");
  });

  it("Pengguna dengan emailVerified = true melewati pengecekan yang sama tanpa hambatan tambahan", async () => {
    const { headers } = await signUpAndGetHeaders("sudah-verifikasi@norvyn.test");
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "sudah-verifikasi@norvyn.test" } });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });

    const session = await auth.api.getSession({ headers });

    expect(() => cekEmailTerverifikasi(session!)).not.toThrow();
  });

  it("Pengguna yang baru saja verifikasi email di tengah sesi langsung lolos pengecekan pada request berikutnya, tanpa perlu login ulang", async () => {
    const { headers } = await signUpAndGetHeaders("verifikasi-tengah-sesi@norvyn.test");

    const sebelum = await auth.api.getSession({ headers });
    expect(() => cekEmailTerverifikasi(sebelum!)).toThrow("Email Anda belum terverifikasi");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "verifikasi-tengah-sesi@norvyn.test" } });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });

    const sesudah = await auth.api.getSession({ headers });
    expect(() => cekEmailTerverifikasi(sesudah!)).not.toThrow();
  });
});

describe("Pengarahan ke halaman yang mensyaratkan Perusahaan aktif (mis. /)", () => {
  it("Pengguna yang belum memiliki Keanggotaan diarahkan ke /daftar-perusahaan", async () => {
    const { headers } = await signUpAndGetHeaders("aktif-belum-punya-perusahaan@norvyn.test");

    const target = await redirectTargetOf(resolvePerusahaanAktifAccess(auth, prisma, headers));

    expect(target).toBe("/daftar-perusahaan");
  });

  it("Pengguna dengan Perusahaan yang belum bayar (status 0) diarahkan ke /subscription", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("aktif-belum-bayar@norvyn.test");
    const perusahaan = await prisma.perusahaan.create({
      data: { kodeperusahaan: "PSH-GUARD-3", namaperusahaan: "Toko Guard Belum Bayar", namadatabase: "pos_test_guard_3" },
    });
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });

    const target = await redirectTargetOf(resolvePerusahaanAktifAccess(auth, prisma, headers));

    expect(target).toBe("/subscription");
  });

  it("Pengguna dengan Perusahaan aktif (status 1) tidak diarahkan (tidak melempar redirect)", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("aktif-sudah-bayar@norvyn.test");
    const perusahaan = await prisma.perusahaan.create({
      data: { kodeperusahaan: "PSH-GUARD-4", namaperusahaan: "Toko Guard Sudah Bayar", namadatabase: "pos_test_guard_4", status: 1 },
    });
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });

    const session = await resolvePerusahaanAktifAccess(auth, prisma, headers);

    expect(session.user.email).toBe("aktif-sudah-bayar@norvyn.test");
  });

  it("permintaan tanpa sesi login diarahkan ke halaman login", async () => {
    const target = await redirectTargetOf(resolvePerusahaanAktifAccess(auth, prisma, new Headers()));

    expect(target).toBe("/login");
  });
});

async function tambahPerusahaan(kodeperusahaan: string, status = 1): Promise<number> {
  const perusahaan = await prisma.perusahaan.create({
    data: { kodeperusahaan, namaperusahaan: `Toko ${kodeperusahaan}`, namadatabase: `pos_test_${kodeperusahaan.toLowerCase()}`, status },
  });

  return perusahaan.idperusahaan;
}

async function tambahKeanggotaan(iduser: string, idperusahaan: number): Promise<void> {
  await prisma.userperusahaan.create({ data: { iduser, idperusahaan, isowner: false } });
}

async function sessionRowFor(iduser: string) {
  return prisma.session.findFirstOrThrow({ where: { iduser } });
}

describe("Pengguna dengan satu Keanggotaan otomatis masuk; dua atau lebih diarahkan ke halaman pilih", () => {
  it("Pengguna dengan tepat satu Keanggotaan otomatis masuk tanpa pernah melihat halaman pilih, dan sesi mencatat idperusahaan-nya", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("otomatis-satu-perusahaan@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-AUTO-1");
    await tambahKeanggotaan(iduser, idperusahaan);

    const session = await resolvePerusahaanAktifAccess(auth, prisma, headers);

    expect(session.user.email).toBe("otomatis-satu-perusahaan@norvyn.test");
    const row = await sessionRowFor(iduser);
    expect(row.idperusahaan).toBe(idperusahaan);
  });

  it("Pengguna dengan dua Keanggotaan dan belum pernah memilih diarahkan ke halaman pilih Perusahaan, idperusahaan sesi tetap kosong", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("otomatis-dua-perusahaan@norvyn.test");
    const a = await tambahPerusahaan("PSH-AUTO-2A");
    const b = await tambahPerusahaan("PSH-AUTO-2B");
    await tambahKeanggotaan(iduser, a);
    await tambahKeanggotaan(iduser, b);

    const target = await redirectTargetOf(resolvePerusahaanAktifAccess(auth, prisma, headers));

    expect(target).toBe("/pilih-perusahaan");
    const row = await sessionRowFor(iduser);
    expect(row.idperusahaan).toBeNull();
  });

  it("Pengguna dengan dua Keanggotaan yang sudah memilih Perusahaan keduanya (bukan yang pertama dibuat) tetap memakai pilihannya, bukan Perusahaan pertama", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("dua-perusahaan-sudah-pilih@norvyn.test");
    const a = await tambahPerusahaan("PSH-AUTO-3A", 0);
    const b = await tambahPerusahaan("PSH-AUTO-3B", 1);
    await tambahKeanggotaan(iduser, a);
    await tambahKeanggotaan(iduser, b);
    const row = await sessionRowFor(iduser);
    await prisma.session.update({ where: { id: row.id }, data: { idperusahaan: b } });

    const session = await resolvePerusahaanAktifAccess(auth, prisma, headers);

    expect(session.user.email).toBe("dua-perusahaan-sudah-pilih@norvyn.test");
  });
});

describe("Keanggotaan diverifikasi ulang setiap request", () => {
  it("Keanggotaan satu-satunya dicabut setelah jadi Perusahaan Aktif: request berikutnya diarahkan ke /daftar-perusahaan, bukan error tak tertangani", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("dicabut-satu-satunya@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-CABUT-1");
    await tambahKeanggotaan(iduser, idperusahaan);
    await resolvePerusahaanAktifAccess(auth, prisma, headers);

    await prisma.userperusahaan.delete({ where: { iduser_idperusahaan: { iduser, idperusahaan } } });

    const target = await redirectTargetOf(resolvePerusahaanAktifAccess(auth, prisma, headers));
    expect(target).toBe("/daftar-perusahaan");
  });

  it("Keanggotaan di Perusahaan Aktif dicabut sementara Keanggotaan lain masih ada: request berikutnya langsung memakai Perusahaan lain itu, tidak menunggu sesi kedaluwarsa", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("dicabut-masih-ada-lain@norvyn.test");
    const a = await tambahPerusahaan("PSH-CABUT-2A");
    const b = await tambahPerusahaan("PSH-CABUT-2B");
    await tambahKeanggotaan(iduser, a);
    await tambahKeanggotaan(iduser, b);
    const row = await sessionRowFor(iduser);
    await prisma.session.update({ where: { id: row.id }, data: { idperusahaan: a } });

    await prisma.userperusahaan.delete({ where: { iduser_idperusahaan: { iduser, idperusahaan: a } } });

    const session = await resolvePerusahaanAktifAccess(auth, prisma, headers);
    expect(session.user.email).toBe("dicabut-masih-ada-lain@norvyn.test");
    const rowSesudah = await sessionRowFor(iduser);
    expect(rowSesudah.idperusahaan).toBe(b);
  });
});
