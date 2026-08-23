import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { insertMembership } from "@/lib/server/keanggotaan/repository";
import { cabutStatusOwner, keluarkanAnggota } from "@/lib/server/keanggotaan/service";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

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

describe("Owner tidak dapat mencabut status Owner sendiri bila satu-satunya Owner", () => {
  it("Perusahaan dengan tepat satu Owner: mencoba mencabut status Owner-nya sendiri ditolak, dan Keanggotaannya tetap Owner", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-CABUT-1");
    const owner = await tambahPengguna("owner-satu@toko.id");
    await tambahMembership(owner, idperusahaan, true);

    await expect(cabutStatusOwner(prisma, { idpemanggil: owner, idusertarget: owner, idperusahaan })).rejects.toThrow(
      /satu-satunya/,
    );

    const membership = await prisma.userperusahaan.findUniqueOrThrow({
      where: { iduser_idperusahaan: { iduser: owner, idperusahaan } },
    });
    expect(membership.isowner).toBe(true);
  });

  it("Perusahaan dengan dua Owner: salah satu Owner mencabut status Owner-nya sendiri berhasil", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-CABUT-2");
    const ownerA = await tambahPengguna("ownera-cabut2@toko.id");
    const ownerB = await tambahPengguna("ownerb-cabut2@toko.id");
    await tambahMembership(ownerA, idperusahaan, true);
    await tambahMembership(ownerB, idperusahaan, true);

    await cabutStatusOwner(prisma, { idpemanggil: ownerA, idusertarget: ownerA, idperusahaan });

    const membership = await prisma.userperusahaan.findUniqueOrThrow({
      where: { iduser_idperusahaan: { iduser: ownerA, idperusahaan } },
    });
    expect(membership.isowner).toBe(false);
  });

  it("Perusahaan dengan dua Owner: Owner A mencabut status Owner dari Owner B berhasil dan Perusahaan tetap punya tepat satu Owner", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-CABUT-3");
    const ownerA = await tambahPengguna("ownera-cabut3@toko.id");
    const ownerB = await tambahPengguna("ownerb-cabut3@toko.id");
    await tambahMembership(ownerA, idperusahaan, true);
    await tambahMembership(ownerB, idperusahaan, true);

    await cabutStatusOwner(prisma, { idpemanggil: ownerA, idusertarget: ownerB, idperusahaan });

    const jumlahOwner = await prisma.userperusahaan.count({ where: { idperusahaan, isowner: true } });
    expect(jumlahOwner).toBe(1);
    const membershipA = await prisma.userperusahaan.findUniqueOrThrow({
      where: { iduser_idperusahaan: { iduser: ownerA, idperusahaan } },
    });
    expect(membershipA.isowner).toBe(true);
  });
});

describe("Anggota bukan Owner tidak dapat menjalankan aksi manajemen pengguna", () => {
  it("Anggota non-Owner mencoba mengeluarkan anggota lain ditolak", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-NONOWNER-3");
    const nonOwner = await tambahPengguna("nonowner3@toko.id");
    await tambahMembership(nonOwner, idperusahaan, false);
    const target = await tambahPengguna("targetnonowner3@toko.id");
    await tambahMembership(target, idperusahaan, false);

    await expect(keluarkanAnggota(prisma, { idpemanggil: nonOwner, idusertarget: target, idperusahaan })).rejects.toThrow(
      /Owner/,
    );
  });
});

describe("Owner mengeluarkan anggota dan anggota kehilangan akses", () => {
  it("Owner mengeluarkan anggota non-Owner menghapus Keanggotaannya dan seluruh baris Hak Menu miliknya di Perusahaan itu", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KELUAR-1");
    const owner = await tambahPengguna("owner-keluar1@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-keluar1@toko.id");
    await tambahMembership(target, idperusahaan, false);
    await prisma.menu.create({ data: { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL" } });
    await prisma.usermenu.create({ data: { iduser: target, idperusahaan, kodemenu: "M01D1", status: 1 } });

    await keluarkanAnggota(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan });

    const membership = await prisma.userperusahaan.findUnique({
      where: { iduser_idperusahaan: { iduser: target, idperusahaan } },
    });
    expect(membership).toBeNull();
    const usermenuRows = await prisma.usermenu.findMany({ where: { iduser: target, idperusahaan } });
    expect(usermenuRows).toEqual([]);
  });

  it("Pengguna yang sudah dikeluarkan lalu ditambahkan kembali sebagai anggota tidak mewarisi Hak Menu dari sebelum dikeluarkan", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KELUAR-2");
    const owner = await tambahPengguna("owner-keluar2@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-keluar2@toko.id");
    await tambahMembership(target, idperusahaan, false);
    await prisma.menu.create({ data: { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL" } });
    await prisma.usermenu.create({ data: { iduser: target, idperusahaan, kodemenu: "M01D1", status: 1 } });

    await keluarkanAnggota(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan });
    await insertMembership(prisma, target, idperusahaan);

    const usermenuRows = await prisma.usermenu.findMany({ where: { iduser: target, idperusahaan } });
    expect(usermenuRows).toEqual([]);
  });

  it("Owner mencoba mengeluarkan dirinya sendiri sebagai satu-satunya Owner ditolak", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KELUAR-3");
    const owner = await tambahPengguna("owner-keluar3@toko.id");
    await tambahMembership(owner, idperusahaan, true);

    await expect(keluarkanAnggota(prisma, { idpemanggil: owner, idusertarget: owner, idperusahaan })).rejects.toThrow(
      /satu-satunya/,
    );

    const membership = await prisma.userperusahaan.findUnique({
      where: { iduser_idperusahaan: { iduser: owner, idperusahaan } },
    });
    expect(membership).not.toBeNull();
  });

  it("Owner mencoba mengeluarkan Pengguna yang bukan anggota Perusahaan itu ditolak", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KELUAR-4");
    const owner = await tambahPengguna("owner-keluar4@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const bukanAnggota = await tambahPengguna("bukananggota4@toko.id");

    await expect(keluarkanAnggota(prisma, { idpemanggil: owner, idusertarget: bukanAnggota, idperusahaan })).rejects.toThrow(
      /bukan anggota/,
    );
  });

  it("Mengeluarkan anggota dari Perusahaan A tidak memengaruhi Keanggotaan maupun Hak Menu Pengguna yang sama di Perusahaan B", async () => {
    const perusahaanA = await tambahPerusahaan("PSH-KELUAR-5A");
    const perusahaanB = await tambahPerusahaan("PSH-KELUAR-5B");
    const owner = await tambahPengguna("owner-keluar5@toko.id");
    await tambahMembership(owner, perusahaanA, true);
    await tambahMembership(owner, perusahaanB, true);
    const target = await tambahPengguna("target-keluar5@toko.id");
    await tambahMembership(target, perusahaanA, false);
    await tambahMembership(target, perusahaanB, false);
    await prisma.menu.create({ data: { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL" } });
    await prisma.usermenu.create({ data: { iduser: target, idperusahaan: perusahaanB, kodemenu: "M01D1", status: 1 } });

    await keluarkanAnggota(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan: perusahaanA });

    const membershipB = await prisma.userperusahaan.findUnique({
      where: { iduser_idperusahaan: { iduser: target, idperusahaan: perusahaanB } },
    });
    expect(membershipB).not.toBeNull();
    const usermenuRowsB = await prisma.usermenu.findMany({ where: { iduser: target, idperusahaan: perusahaanB } });
    expect(usermenuRowsB).toHaveLength(1);
  });

  it("Dua permintaan mengeluarkan anggota yang sama diproses bersamaan: hanya satu yang berhasil menghapus, permintaan lainnya ditolak", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KELUAR-6");
    const owner = await tambahPengguna("owner-keluar6@toko.id");
    await tambahMembership(owner, idperusahaan, true);
    const target = await tambahPengguna("target-keluar6@toko.id");
    await tambahMembership(target, idperusahaan, false);

    const hasil = await Promise.allSettled([
      keluarkanAnggota(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan }),
      keluarkanAnggota(prisma, { idpemanggil: owner, idusertarget: target, idperusahaan }),
    ]);

    const berhasil = hasil.filter((item) => item.status === "fulfilled");
    const ditolak = hasil.filter((item) => item.status === "rejected");
    expect(berhasil).toHaveLength(1);
    expect(ditolak).toHaveLength(1);
  });
});
