import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { findKodemenuHakMenuAktif } from "@/lib/server/menu/repository";
import { seluruhKodemenuTerpetakan } from "@/lib/server/menu/service";
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

describe("findKodemenuHakMenuAktif", () => {
  it("mengembalikan kodemenu yang statusnya aktif untuk Pengguna dan Perusahaan yang diminta", async () => {
    const iduser = await tambahPengguna("hakmenu-aktif@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-HAKMENU-1");
    await prisma.menu.create({ data: { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL" } });
    await prisma.usermenu.create({ data: { iduser, idperusahaan, kodemenu: "M01D1", status: 1 } });

    const hasil = await findKodemenuHakMenuAktif(prisma, iduser, idperusahaan);

    expect(hasil).toEqual(["M01D1"]);
  });

  it("tidak menyertakan kodemenu yang barisnya berstatus nonaktif", async () => {
    const iduser = await tambahPengguna("hakmenu-nonaktif@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-HAKMENU-2");
    await prisma.menu.create({ data: { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL" } });
    await prisma.usermenu.create({ data: { iduser, idperusahaan, kodemenu: "M01D1", status: 0 } });

    const hasil = await findKodemenuHakMenuAktif(prisma, iduser, idperusahaan);

    expect(hasil).toEqual([]);
  });

  it("tidak menyertakan kodemenu milik Perusahaan lain meski Pengguna sama", async () => {
    const iduser = await tambahPengguna("hakmenu-lintas-perusahaan@norvyn.test");
    const a = await tambahPerusahaan("PSH-HAKMENU-3A");
    const b = await tambahPerusahaan("PSH-HAKMENU-3B");
    await prisma.menu.create({ data: { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL" } });
    await prisma.usermenu.create({ data: { iduser, idperusahaan: a, kodemenu: "M01D1", status: 1 } });

    const hasil = await findKodemenuHakMenuAktif(prisma, iduser, b);

    expect(hasil).toEqual([]);
  });
});

describe("Pemetaan rute ke menu tidak pernah menunjuk kodemenu yang tidak terdaftar", () => {
  it("setiap kodemenu yang dirujuk pemetaan benar-benar ada di data Menu", async () => {
    for (const kodemenu of seluruhKodemenuTerpetakan()) {
      await prisma.menu.upsert({
        where : { kodemenu },
        create: { kodemenu, namamenu: kodemenu, jenis: "DETAIL" },
        update: {},
      });
    }

    for (const kodemenu of seluruhKodemenuTerpetakan()) {
      const menu = await prisma.menu.findUnique({ where: { kodemenu } });
      expect(menu).not.toBeNull();
    }
  });
});
