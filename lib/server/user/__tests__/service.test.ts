import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { listMembershipsForUser } from "@/lib/server/user/service";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
}, 60_000);

afterAll(async () => {
  await tearDown();
});

function createUser(id: string, email: string) {
  return prisma.user.create({ data: { id, name: email, email, emailVerified: false } });
}

function createPerusahaan(kodeperusahaan: string, namaperusahaan: string, namadatabase: string) {
  return prisma.perusahaan.create({ data: { kodeperusahaan, namaperusahaan, namadatabase } });
}

describe("listMembershipsForUser mengembalikan seluruh Perusahaan milik satu Pengguna", () => {
  it("mengembalikan Perusahaan yang diikuti beserta status isowner-nya", async () => {
    const user = await createUser("user-satu", "satu@norvyn.test");
    const perusahaan = await createPerusahaan("PSH-0001", "Toko Satu", "pos_test_toko_satu");
    await prisma.userperusahaan.create({
      data: { iduser: user.id, idperusahaan: perusahaan.idperusahaan, isowner: true },
    });

    const memberships = await listMembershipsForUser(prisma, user.id);

    expect(memberships).toEqual([
      {
        idperusahaan  : perusahaan.idperusahaan,
        kodeperusahaan: "PSH-0001",
        namaperusahaan: "Toko Satu",
        isowner       : true,
      },
    ]);
  });

  it("mengembalikan daftar kosong untuk Pengguna yang belum menjadi anggota Perusahaan manapun", async () => {
    const user = await createUser("user-tanpa-perusahaan", "duabelas@norvyn.test");

    expect(await listMembershipsForUser(prisma, user.id)).toEqual([]);
  });
});

describe("Keanggotaan tunduk pada Pengguna induknya lewat foreign key", () => {
  it("menghapus Pengguna ikut menghapus baris Keanggotaan miliknya", async () => {
    const user = await createUser("user-dihapus", "dihapus@norvyn.test");
    const perusahaan = await createPerusahaan("PSH-0002", "Toko Dua", "pos_test_toko_dua");
    await prisma.userperusahaan.create({
      data: { iduser: user.id, idperusahaan: perusahaan.idperusahaan, isowner: false },
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.userperusahaan.findMany({ where: { idperusahaan: perusahaan.idperusahaan } })).toEqual([]);
  });

  it("membuat Keanggotaan untuk iduser yang tidak terdaftar di tabel user ditolak database", async () => {
    const perusahaan = await createPerusahaan("PSH-0003", "Toko Tiga", "pos_test_toko_tiga");

    await expect(
      prisma.userperusahaan.create({
        data: { iduser: "user-tidak-ada", idperusahaan: perusahaan.idperusahaan, isowner: false },
      }),
    ).rejects.toThrow();
  });
});
