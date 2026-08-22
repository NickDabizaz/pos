import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import {
  cekEmailTerverifikasi,
  requireAksesMenu,
  resolveDaftarPerusahaanAccess,
  resolvePerusahaanAktifAccess,
  resolveSudahPunyaPerusahaanAccess,
} from "@/lib/server/auth/guard";
import { filterMenuUntukPengguna } from "@/lib/server/menu/service";
import type { MenuNode } from "@/lib/server/menu/types";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

const SESSION_COOKIE_NAME = "better-auth.session_token";
const KODEMENU_LOKASI = "M01D1";
const KODEMENU_BARANG = "M02D1";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
  auth = createAuth(prisma);
  await prisma.menu.createMany({
    data: [
      { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL" },
      { kodemenu: "M02D1", namamenu: "Barang", jenis: "DETAIL" },
    ],
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

async function tambahKeanggotaanOwner(iduser: string, idperusahaan: number): Promise<void> {
  await prisma.userperusahaan.create({ data: { iduser, idperusahaan, isowner: true } });
}

async function tambahHakMenu(iduser: string, idperusahaan: number, kodemenu: string, status = 1): Promise<void> {
  await prisma.usermenu.create({ data: { iduser, idperusahaan, kodemenu, status } });
}

async function pilihPerusahaanAktif(iduser: string, idperusahaan: number): Promise<void> {
  const row = await sessionRowFor(iduser);
  await prisma.session.update({ where: { id: row.id }, data: { idperusahaan } });
}

describe("requireAksesMenu: login wajib sebelum pengecekan lain", () => {
  it("request tanpa cookie sesi sama sekali ditolak", async () => {
    await expect(requireAksesMenu(auth, prisma, new Headers(), KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "TIDAK_LOGIN",
    });
  });

  it("request dengan cookie sesi yang tidak valid/sudah dihapus ditolak dengan cara yang sama seperti tanpa sesi", async () => {
    const headersTidakValid = new Headers({ cookie: "better-auth.session_token=token-palsu-tidak-pernah-ada" });

    await expect(requireAksesMenu(auth, prisma, headersTidakValid, KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "TIDAK_LOGIN",
    });
  });
});

describe("requireAksesMenu: Langganan Perusahaan Aktif harus aktif", () => {
  it("Owner dari Perusahaan berlangganan aktif (status 1) lolos", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-owner-aktif@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-1", 1);
    await tambahKeanggotaanOwner(iduser, idperusahaan);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const hasil = await requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI);

    expect(hasil.session.user.email).toBe("guard-menu-owner-aktif@norvyn.test");
  });

  it("Owner dari Perusahaan belum bayar (status 0) ditolak walau Owner", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-owner-belum-bayar@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-2", 0);
    await tambahKeanggotaanOwner(iduser, idperusahaan);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "LANGGANAN_TIDAK_AKTIF",
    });
  });

  it("Owner di Perusahaan A (aktif) dan anggota di Perusahaan B (belum bayar): status Perusahaan B tidak mempengaruhi pemeriksaan", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-dua-perusahaan@norvyn.test");
    const a = await tambahPerusahaan("PSH-MENU-3A", 1);
    const b = await tambahPerusahaan("PSH-MENU-3B", 0);
    await tambahKeanggotaanOwner(iduser, a);
    await tambahKeanggotaan(iduser, b);
    await pilihPerusahaanAktif(iduser, a);

    const hasil = await requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI);

    expect(hasil.session.user.email).toBe("guard-menu-dua-perusahaan@norvyn.test");
  });
});

describe("requireAksesMenu: karyawan tanpa Hak Menu aktif untuk menu terkait ditolak", () => {
  it("karyawan dengan Hak Menu aktif untuk kodemenu terkait lolos", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-karyawan-punya-hak@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-4", 1);
    await tambahKeanggotaan(iduser, idperusahaan);
    await tambahHakMenu(iduser, idperusahaan, KODEMENU_LOKASI, 1);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const hasil = await requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI);

    expect(hasil.session.user.email).toBe("guard-menu-karyawan-punya-hak@norvyn.test");
  });

  it("karyawan tanpa satu pun baris Hak Menu untuk kodemenu terkait ditolak", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-karyawan-tanpa-hak@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-5", 1);
    await tambahKeanggotaan(iduser, idperusahaan);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "TIDAK_PUNYA_HAK_MENU",
    });
  });

  it("karyawan dengan baris Hak Menu berstatus nonaktif untuk kodemenu terkait ditolak", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-karyawan-hak-nonaktif@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-6", 1);
    await tambahKeanggotaan(iduser, idperusahaan);
    await tambahHakMenu(iduser, idperusahaan, KODEMENU_LOKASI, 0);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "TIDAK_PUNYA_HAK_MENU",
    });
  });

  it("karyawan dengan Hak Menu aktif untuk menu lain tidak lolos untuk menu yang diminta", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-karyawan-menu-lain@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-7", 1);
    await tambahKeanggotaan(iduser, idperusahaan);
    await tambahHakMenu(iduser, idperusahaan, KODEMENU_BARANG, 1);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "TIDAK_PUNYA_HAK_MENU",
    });
  });

  it("memanggil requireAksesMenu langsung tanpa lewat UI tetap diperiksa dan ditolak untuk karyawan tanpa Hak Menu", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-panggil-langsung@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-8", 1);
    await tambahKeanggotaan(iduser, idperusahaan);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_BARANG)).rejects.toMatchObject({
      cause: "TIDAK_PUNYA_HAK_MENU",
    });
  });
});

describe("requireAksesMenu: Owner selalu lolos pengecekan Hak Menu", () => {
  it("Owner tanpa satu pun baris Hak Menu di Perusahaan Aktifnya lolos", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-owner-tanpa-hak@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-9", 1);
    await tambahKeanggotaanOwner(iduser, idperusahaan);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const hasil = await requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI);

    expect(hasil.isOwner).toBe(true);
  });

  it("Owner dengan baris Hak Menu berstatus nonaktif tetap lolos (bypass berbasis isowner, bukan default allow)", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-owner-hak-nonaktif@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-10", 1);
    await tambahKeanggotaanOwner(iduser, idperusahaan);
    await tambahHakMenu(iduser, idperusahaan, KODEMENU_LOKASI, 0);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const hasil = await requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI);

    expect(hasil.isOwner).toBe(true);
  });
});

describe("requireAksesMenu: Hak Menu dan status Owner terikat ke satu Perusahaan", () => {
  it("Hak Menu aktif di Perusahaan A tidak dibawa ke Perusahaan B", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-isolasi-hakmenu@norvyn.test");
    const a = await tambahPerusahaan("PSH-MENU-11A", 1);
    const b = await tambahPerusahaan("PSH-MENU-11B", 1);
    await tambahKeanggotaan(iduser, a);
    await tambahKeanggotaan(iduser, b);
    await tambahHakMenu(iduser, a, KODEMENU_LOKASI, 1);
    await pilihPerusahaanAktif(iduser, b);

    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "TIDAK_PUNYA_HAK_MENU",
    });
  });

  it("Owner di Perusahaan A tidak mendapat bypass Owner saat Perusahaan Aktif adalah B", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-isolasi-owner@norvyn.test");
    const a = await tambahPerusahaan("PSH-MENU-12A", 1);
    const b = await tambahPerusahaan("PSH-MENU-12B", 1);
    await tambahKeanggotaanOwner(iduser, a);
    await tambahKeanggotaan(iduser, b);
    await pilihPerusahaanAktif(iduser, b);

    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI)).rejects.toMatchObject({
      cause: "TIDAK_PUNYA_HAK_MENU",
    });
  });
});

describe("Sidebar dan guard API tidak pernah berbeda pendapat", () => {
  const treeUjiCoba: MenuNode[] = [
    {
      kodemenu: "MU",
      namamenu: "Master Uji",
      jenis   : "HEADER",
      urutan  : "1",
      children: [
        { kodemenu: KODEMENU_LOKASI, namamenu: "Lokasi", jenis: "DETAIL", urutan: "1", children: [] },
        { kodemenu: KODEMENU_BARANG, namamenu: "Barang", jenis: "DETAIL", urutan: "2", children: [] },
      ],
    },
  ];

  it("karyawan dengan Hak Menu aktif hanya untuk Lokasi: kodemenu yang lolos filter Sidebar sama persis dengan kodemenu yang lolos requireAksesMenu", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("guard-menu-konsistensi-sidebar@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-MENU-13", 1);
    await tambahKeanggotaan(iduser, idperusahaan);
    await tambahHakMenu(iduser, idperusahaan, KODEMENU_LOKASI, 1);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const hasilGuardLokasi = await requireAksesMenu(auth, prisma, headers, KODEMENU_LOKASI);
    const sidebar = filterMenuUntukPengguna(treeUjiCoba, {
      isOwner          : hasilGuardLokasi.isOwner,
      kodemenuDiizinkan: hasilGuardLokasi.kodemenuDiizinkan,
    });
    const kodemenuDiSidebar = sidebar[0].children.map((node) => node.kodemenu);

    expect(kodemenuDiSidebar).toEqual([KODEMENU_LOKASI]);
    await expect(requireAksesMenu(auth, prisma, headers, KODEMENU_BARANG)).rejects.toMatchObject({
      cause: "TIDAK_PUNYA_HAK_MENU",
    });
  });
});
