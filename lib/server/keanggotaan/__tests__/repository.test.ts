import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { cariKandidatAnggota } from "@/lib/server/keanggotaan/repository";
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

describe("Owner mencari kandidat anggota lewat email", () => {
  it('mencari "budi" menemukan Pengguna dengan email budi@toko.id maupun BUDI2@toko.id', async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KAND-1");
    await tambahPengguna("budi@toko.id");
    await tambahPengguna("BUDI2@toko.id");
    await tambahPengguna("lain@toko.id");

    const hasil = await cariKandidatAnggota(prisma, idperusahaan, "budi");

    const emails = hasil.map((kandidat) => kandidat.email).sort();
    expect(emails).toEqual(["BUDI2@toko.id", "budi@toko.id"]);
  });

  it("mencari email yang tidak cocok dengan Pengguna manapun mengembalikan daftar kandidat kosong, bukan error", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KAND-2");
    await tambahPengguna("ada@toko.id");

    const hasil = await cariKandidatAnggota(prisma, idperusahaan, "tidak-ada-yang-cocok");

    expect(hasil).toEqual([]);
  });

  it("Pengguna yang sudah menjadi anggota Perusahaan ini tidak muncul di hasil pencarian kandidat", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-KAND-3");
    const iduser = await tambahPengguna("sudahanggota@toko.id");
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan, isowner: false } });

    const hasil = await cariKandidatAnggota(prisma, idperusahaan, "sudahanggota");

    expect(hasil).toEqual([]);
  });
});
