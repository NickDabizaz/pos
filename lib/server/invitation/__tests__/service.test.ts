import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { buatInvitation, gabungViaInvitation } from "@/lib/server/invitation/service";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
}, 60_000);

afterAll(async () => {
  await tearDown();
});

const GLOBAL_TABLES = ["invitationperusahaan", "usermenu", "userperusahaan", "menu", "perusahaan", "account", "session", "verification", "user"];

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

async function tambahSesi(iduser: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      id       : randomUUID(),
      iduser,
      token    : randomUUID(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return session.id;
}

describe("Owner membuat link invitation", () => {
  it("membuat link invitation baru untuk Perusahaan", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-INV-1");

    const invitation = await buatInvitation(prisma, idperusahaan);

    expect(invitation.url).toContain(invitation.token);
    const row = await prisma.invitationperusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(row.token).toBe(invitation.token);
  });

  it("membuat link invitation baru menggantikan link lama, link lama tidak lagi berlaku", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-INV-2");
    const lama = await buatInvitation(prisma, idperusahaan);

    const baru = await buatInvitation(prisma, idperusahaan);

    expect(baru.token).not.toBe(lama.token);
    const pengguna = await tambahPengguna("karyawan-inv2@toko.id");
    const idsesi = await tambahSesi(pengguna);
    await expect(gabungViaInvitation(prisma, { token: lama.token, iduser: pengguna, idsesi })).rejects.toThrow(
      /tidak ditemukan/,
    );
  });
});

describe("Pengguna bergabung lewat link invitation", () => {
  it("bergabung lewat link invitation yang valid tercatat sebagai anggota non-Owner", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-INV-3");
    const invitation = await buatInvitation(prisma, idperusahaan);
    const pengguna = await tambahPengguna("karyawan-inv3@toko.id");
    const idsesi = await tambahSesi(pengguna);

    await gabungViaInvitation(prisma, { token: invitation.token, iduser: pengguna, idsesi });

    const membership = await prisma.userperusahaan.findUniqueOrThrow({
      where: { iduser_idperusahaan: { iduser: pengguna, idperusahaan } },
    });
    expect(membership.isowner).toBe(false);
    const session = await prisma.session.findUniqueOrThrow({ where: { id: idsesi } });
    expect(session.idperusahaan).toBe(idperusahaan);
  });

  it("membuka link invitation yang sama dua kali tidak menghasilkan error, tetap satu Keanggotaan", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-INV-4");
    const invitation = await buatInvitation(prisma, idperusahaan);
    const pengguna = await tambahPengguna("karyawan-inv4@toko.id");
    const idsesi = await tambahSesi(pengguna);

    await gabungViaInvitation(prisma, { token: invitation.token, iduser: pengguna, idsesi });
    await gabungViaInvitation(prisma, { token: invitation.token, iduser: pengguna, idsesi });

    const jumlah = await prisma.userperusahaan.count({ where: { iduser: pengguna, idperusahaan } });
    expect(jumlah).toBe(1);
  });

  it("bergabung ke Perusahaan B lewat invitation tidak memengaruhi Keanggotaan di Perusahaan A", async () => {
    const perusahaanA = await tambahPerusahaan("PSH-INV-5A");
    const perusahaanB = await tambahPerusahaan("PSH-INV-5B");
    const pengguna = await tambahPengguna("karyawan-inv5@toko.id");
    await tambahMembership(pengguna, perusahaanA, false);
    const invitation = await buatInvitation(prisma, perusahaanB);
    const idsesi = await tambahSesi(pengguna);

    await gabungViaInvitation(prisma, { token: invitation.token, iduser: pengguna, idsesi });

    const membershipA = await prisma.userperusahaan.findUniqueOrThrow({
      where: { iduser_idperusahaan: { iduser: pengguna, idperusahaan: perusahaanA } },
    });
    expect(membershipA.isowner).toBe(false);
  });

  it("membuka token invitation yang tidak dikenal ditolak dengan pesan jelas", async () => {
    const pengguna = await tambahPengguna("karyawan-inv6@toko.id");
    const idsesi = await tambahSesi(pengguna);

    await expect(gabungViaInvitation(prisma, { token: "token-tidak-ada", iduser: pengguna, idsesi })).rejects.toThrow(
      /tidak ditemukan/,
    );
  });

  it("membuka link invitation yang sudah kedaluwarsa ditolak", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-INV-7");
    const invitation = await buatInvitation(prisma, idperusahaan);
    await prisma.invitationperusahaan.update({
      where: { token: invitation.token },
      data : { expiresat: new Date(Date.now() - 1000) },
    });
    const pengguna = await tambahPengguna("karyawan-inv7@toko.id");
    const idsesi = await tambahSesi(pengguna);

    await expect(gabungViaInvitation(prisma, { token: invitation.token, iduser: pengguna, idsesi })).rejects.toThrow(
      /kedaluwarsa/,
    );
  });
});
