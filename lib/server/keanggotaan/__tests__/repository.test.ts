import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { findAnggotaPerusahaan } from "@/lib/server/keanggotaan/repository";
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

describe("Owner melihat daftar anggota Perusahaan", () => {
  it("mengembalikan seluruh anggota beserta status Owner-nya", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-ANGG-1");
    const idowner = await tambahPengguna("owner@toko.id");
    const idkaryawan = await tambahPengguna("karyawan@toko.id");
    await prisma.userperusahaan.create({ data: { iduser: idowner, idperusahaan, isowner: true } });
    await prisma.userperusahaan.create({ data: { iduser: idkaryawan, idperusahaan, isowner: false } });

    const hasil = await findAnggotaPerusahaan(prisma, idperusahaan);

    expect(hasil).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ iduser: idowner, email: "owner@toko.id", isowner: true }),
        expect.objectContaining({ iduser: idkaryawan, email: "karyawan@toko.id", isowner: false }),
      ]),
    );
    expect(hasil).toHaveLength(2);
  });

  it("Perusahaan tanpa anggota mengembalikan daftar kosong, bukan error", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-ANGG-2");

    const hasil = await findAnggotaPerusahaan(prisma, idperusahaan);

    expect(hasil).toEqual([]);
  });

  it("anggota Perusahaan lain tidak ikut muncul", async () => {
    const idperusahaanA = await tambahPerusahaan("PSH-ANGG-3A");
    const idperusahaanB = await tambahPerusahaan("PSH-ANGG-3B");
    const iduser = await tambahPengguna("lintas@toko.id");
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: idperusahaanA, isowner: true } });

    const hasil = await findAnggotaPerusahaan(prisma, idperusahaanB);

    expect(hasil).toEqual([]);
  });
});
