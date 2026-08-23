import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { findKodemenuHakMenuAktif } from "@/lib/server/menu/repository";
import {
  bolehAksesMenu,
  buildMenuTree,
  filterMenuUntukPengguna,
  kodemenuUntukRute,
  matikanHakMenu,
  nyalakanHakMenu,
} from "@/lib/server/menu/service";
import type { MenuNode } from "@/lib/server/menu/types";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

describe("buildMenuTree", () => {
  it("returns an empty tree for an empty row list", () => {
    expect(buildMenuTree([])).toEqual([]);
  });

  it("places a row with no parent at the root", () => {
    const rows = [
      { kodemenu: "M01", kodeinduk: null, namamenu: "Master", jenis: "HEADER", urutan: "1" },
    ];

    expect(buildMenuTree(rows)).toEqual([
      { kodemenu: "M01", namamenu: "Master", jenis: "HEADER", urutan: "1", children: [] },
    ]);
  });

  it("nests a row under its parent via kodeinduk", () => {
    const rows = [
      { kodemenu: "M01", kodeinduk: null, namamenu: "Master", jenis: "HEADER", urutan: "1" },
      { kodemenu: "M01D1", kodeinduk: "M01", namamenu: "Produk", jenis: "DETAIL", urutan: "1" },
    ];

    expect(buildMenuTree(rows)).toEqual([
      {
        kodemenu: "M01",
        namamenu: "Master",
        jenis   : "HEADER",
        urutan  : "1",
        children: [
          { kodemenu: "M01D1", namamenu: "Produk", jenis: "DETAIL", urutan: "1", children: [] },
        ],
      },
    ]);
  });

  it("treats a row with a dangling kodeinduk as a root", () => {
    const rows = [
      { kodemenu: "M01D1", kodeinduk: "MISSING", namamenu: "Produk", jenis: "DETAIL", urutan: "1" },
    ];

    expect(buildMenuTree(rows)).toEqual([
      { kodemenu: "M01D1", namamenu: "Produk", jenis: "DETAIL", urutan: "1", children: [] },
    ]);
  });
});

describe("kodemenuUntukRute", () => {
  it("mengembalikan kodemenu untuk rute yang terdaftar di pemetaan", () => {
    expect(kodemenuUntukRute("GET /api/menu/tree")).toBe("MDATA-LOK");
  });

  it("melempar kegagalan yang jelas untuk rute yang tidak terdaftar, bukan diam-diam meloloskan akses", () => {
    expect(() => kodemenuUntukRute("GET /api/rute/tidak-ada")).toThrow(/belum terdaftar/);
  });
});

describe("bolehAksesMenu", () => {
  it("Owner selalu lolos walau kodemenuDiizinkan kosong", () => {
    expect(bolehAksesMenu({ isOwner: true, kodemenuDiizinkan: new Set(), kodemenu: "M01D1" })).toBe(true);
  });

  it("karyawan lolos hanya untuk kodemenu yang ada di kodemenuDiizinkan", () => {
    const kodemenuDiizinkan = new Set(["M01D1"]);

    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan, kodemenu: "M01D1" })).toBe(true);
    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan, kodemenu: "M02D1" })).toBe(false);
  });
});

describe("filterMenuUntukPengguna", () => {
  const tree: MenuNode[] = [
    {
      kodemenu: "M01",
      namamenu: "Master",
      jenis   : "HEADER",
      urutan  : "1",
      children: [
        { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL", urutan: "1", children: [] },
        { kodemenu: "M02D1", namamenu: "Barang", jenis: "DETAIL", urutan: "2", children: [] },
      ],
    },
  ];

  it("Owner melihat seluruh Menu aktif walau tidak punya satu pun baris Hak Menu", () => {
    expect(filterMenuUntukPengguna(tree, { isOwner: true, kodemenuDiizinkan: new Set() })).toEqual(tree);
  });

  it("karyawan dengan Hak Menu aktif hanya untuk satu kodemenu hanya melihat menu itu beserta induknya", () => {
    const hasil = filterMenuUntukPengguna(tree, { isOwner: false, kodemenuDiizinkan: new Set(["M01D1"]) });

    expect(hasil).toEqual([
      {
        kodemenu: "M01",
        namamenu: "Master",
        jenis   : "HEADER",
        urutan  : "1",
        children: [
          { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL", urutan: "1", children: [] },
        ],
      },
    ]);
  });

  it("karyawan tanpa satu pun Hak Menu melihat Sidebar kosong, bukan error dan bukan seluruh menu", () => {
    expect(filterMenuUntukPengguna(tree, { isOwner: false, kodemenuDiizinkan: new Set() })).toEqual([]);
  });
});

let prisma: PrismaClient;
let tearDown: () => Promise<void>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
}, 60_000);

afterAll(async () => {
  await tearDown();
});

const GLOBAL_TABLES = ["usermenu", "userperusahaan", "menu", "perusahaan", "account", "session", "verification", "user"];

afterEach(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const table of GLOBAL_TABLES) {
        await tx.$executeRawUnsafe(`DELETE FROM \`${table}\``);
      }
    } finally {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }
  });
});

async function tambahPengguna(email: string): Promise<string> {
  const user = await prisma.user.create({ data: { id: randomUUID(), email, name: email, emailVerified: true } });

  return user.id;
}

async function tambahPerusahaan(kodeperusahaan: string): Promise<number> {
  const perusahaan = await prisma.perusahaan.create({
    data: { kodeperusahaan, namaperusahaan: `Toko ${kodeperusahaan}`, namadatabase: `pos_test_${kodeperusahaan.toLowerCase()}`, status: 1 },
  });

  return perusahaan.idperusahaan;
}

async function tambahMembership(iduser: string, idperusahaan: number, isowner: boolean): Promise<void> {
  await prisma.userperusahaan.create({ data: { iduser, idperusahaan, isowner } });
}

describe("Owner menyalakan dan mematikan Hak Menu per anggota", () => {
  it('Owner menyalakan Hak Menu untuk menu "MDATA-LOK" pada satu anggota tercatat aktif, dan anggota itu lolos pemeriksaan akses menu tersebut', async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-1");
    const owner = await tambahPengguna("owner-hm1@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-hm1@toko.id");
    await tambahMembership(target, idperusahaan, false);
    await prisma.menu.create({ data: { kodemenu: "MDATA-LOK", namamenu: "Lokasi", jenis: "DETAIL" } });

    await nyalakanHakMenu(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan, kodemenu: "MDATA-LOK" });

    const kodemenuAktif = await findKodemenuHakMenuAktif(prisma, target, idperusahaan);
    expect(kodemenuAktif).toEqual(["MDATA-LOK"]);
    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan: new Set(kodemenuAktif), kodemenu: "MDATA-LOK" })).toBe(true);
  });

  it("Owner mematikan Hak Menu yang tadinya aktif mengubah statusnya jadi nonaktif, bukan menghapus barisnya, dan anggota itu langsung gagal pemeriksaan akses", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-2");
    const owner = await tambahPengguna("owner-hm2@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-hm2@toko.id");
    await tambahMembership(target, idperusahaan, false);
    await prisma.menu.create({ data: { kodemenu: "MDATA-LOK", namamenu: "Lokasi", jenis: "DETAIL" } });
    await nyalakanHakMenu(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan, kodemenu: "MDATA-LOK" });

    await matikanHakMenu(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan, kodemenu: "MDATA-LOK" });

    const baris = await prisma.usermenu.findUniqueOrThrow({
      where: { iduser_idperusahaan_kodemenu: { iduser: target, idperusahaan, kodemenu: "MDATA-LOK" } },
    });
    expect(baris.status).toBe(0);
    const kodemenuAktif = await findKodemenuHakMenuAktif(prisma, target, idperusahaan);
    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan: new Set(kodemenuAktif), kodemenu: "MDATA-LOK" })).toBe(false);
  });

  it("Owner menyalakan Hak Menu untuk kodemenu yang tidak dikenal ditolak dengan pesan jelas", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-3");
    const owner = await tambahPengguna("owner-hm3@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-hm3@toko.id");
    await tambahMembership(target, idperusahaan, false);

    await expect(
      nyalakanHakMenu(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan, kodemenu: "TIDAK-ADA" }),
    ).rejects.toThrow(/tidak ditemukan/);
  });

  it("Owner mengatur Hak Menu untuk Pengguna yang bukan anggota Perusahaan itu ditolak", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-4");
    const owner = await tambahPengguna("owner-hm4@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const bukanAnggota = await tambahPengguna("bukananggota-hm4@toko.id");
    await prisma.menu.create({ data: { kodemenu: "MDATA-LOK", namamenu: "Lokasi", jenis: "DETAIL" } });

    await expect(
      nyalakanHakMenu(prisma, { idpemanggil: owner, idusertarget: bukanAnggota, idperusahaan, kodemenu: "MDATA-LOK" }),
    ).rejects.toThrow(/bukan anggota/);
  });

  it("Owner mencoba mengatur Hak Menu untuk anggota yang berstatus Owner ditolak dengan pesan jelas yang menyebut Owner selalu melewati Hak Menu", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-5");
    const owner = await tambahPengguna("owner-hm5@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const ownerLain = await tambahPengguna("ownerlain-hm5@toko.id");
    await tambahMembership(ownerLain, idperusahaan, true);
    await prisma.menu.create({ data: { kodemenu: "MDATA-LOK", namamenu: "Lokasi", jenis: "DETAIL" } });

    await expect(
      nyalakanHakMenu(prisma, { idpemanggil: owner, idusertarget: ownerLain, idperusahaan, kodemenu: "MDATA-LOK" }),
    ).rejects.toThrow(/Owner selalu melewati Hak Menu/);
  });

  it("Owner mencoba menyalakan Hak Menu untuk kodemenu berjenis HEADER ditolak, karena Hak Menu hanya berlaku untuk menu DETAIL", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-6");
    const owner = await tambahPengguna("owner-hm6@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-hm6@toko.id");
    await tambahMembership(target, idperusahaan, false);
    await prisma.menu.create({ data: { kodemenu: "MDATA", namamenu: "Master Data", jenis: "HEADER" } });

    await expect(
      nyalakanHakMenu(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan, kodemenu: "MDATA" }),
    ).rejects.toThrow(/DETAIL/);
  });

  it("Menyalakan Hak Menu untuk satu anggota di Perusahaan A tidak mengubah Hak Menu Pengguna yang sama di Perusahaan B", async () => {
    const perusahaanA = await tambahPerusahaan("PSH-HM-7A");
    const perusahaanB = await tambahPerusahaan("PSH-HM-7B");
    const ownerA = await tambahPengguna("owner-hm7a@toko.id");
    await tambahMembership(ownerA, perusahaanA, true);
    const target = await tambahPengguna("target-hm7@toko.id");
    await tambahMembership(target, perusahaanA, false);
    await tambahMembership(target, perusahaanB, false);
    await prisma.menu.create({ data: { kodemenu: "MDATA-LOK", namamenu: "Lokasi", jenis: "DETAIL" } });

    await nyalakanHakMenu(prisma, { idpemanggil: ownerA, idusertarget: target, idperusahaan: perusahaanA, kodemenu: "MDATA-LOK" });

    const kodemenuAktifB = await findKodemenuHakMenuAktif(prisma, target, perusahaanB);
    expect(kodemenuAktifB).toEqual([]);
  });
});

describe("Mencabut Hak Menu langsung berlaku tanpa logout", () => {
  it("setelah Owner mematikan Hak Menu, pemeriksaan akses berikutnya langsung menolak menu tersebut tanpa invalidasi sesi apa pun", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-8");
    const owner = await tambahPengguna("owner-hm8@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-hm8@toko.id");
    await tambahMembership(target, idperusahaan, false);
    await prisma.menu.create({ data: { kodemenu: "MDATA-LOK", namamenu: "Lokasi", jenis: "DETAIL" } });
    await nyalakanHakMenu(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan, kodemenu: "MDATA-LOK" });

    const sebelum = await findKodemenuHakMenuAktif(prisma, target, idperusahaan);
    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan: new Set(sebelum), kodemenu: "MDATA-LOK" })).toBe(true);

    await matikanHakMenu(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan, kodemenu: "MDATA-LOK" });

    const sesudah = await findKodemenuHakMenuAktif(prisma, target, idperusahaan);
    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan: new Set(sesudah), kodemenu: "MDATA-LOK" })).toBe(false);
  });
});

describe("Anggota bukan Owner tidak dapat mengubah Hak Menu anggota lain", () => {
  it("Anggota non-Owner mencoba mengubah Hak Menu anggota lain ditolak", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-HM-9");
    const nonOwner = await tambahPengguna("nonowner-hm9@toko.id");
    await tambahMembership(nonOwner, idperusahaan, false);
    const target = await tambahPengguna("target-hm9@toko.id");
    await tambahMembership(target, idperusahaan, false);
    await prisma.menu.create({ data: { kodemenu: "MDATA-LOK", namamenu: "Lokasi", jenis: "DETAIL" } });

    await expect(
      nyalakanHakMenu(prisma, { idpemanggil: nonOwner, idusertarget: target, idperusahaan, kodemenu: "MDATA-LOK" }),
    ).rejects.toThrow(/Owner/);
  });
});
