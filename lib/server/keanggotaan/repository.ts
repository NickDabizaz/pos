import { Prisma } from "@/lib/generated/prisma-global/client";
import type { GlobalClient, KandidatAnggota } from "@/lib/server/keanggotaan/types";

export async function cariKandidatAnggota(db: GlobalClient, idperusahaan: number, kataKunci: string): Promise<KandidatAnggota[]> {
  const rows = await db.user.findMany({
    where: {
      email          : { contains: kataKunci },
      userperusahaans: { none: { idperusahaan } },
    },
    select: { id: true, email: true, name: true },
  });

  const kandidat = rows.map((row) => ({ iduser: row.id, email: row.email, name: row.name }));

  return kandidat;
}

export async function insertMembership(db: GlobalClient, iduser: string, idperusahaan: number): Promise<void> {
  await db.userperusahaan.create({ data: { iduser, idperusahaan, isowner: false } });
}

export async function deleteMembership(db: GlobalClient, iduser: string, idperusahaan: number): Promise<number> {
  const hasil = await db.userperusahaan.deleteMany({ where: { iduser, idperusahaan } });

  return hasil.count;
}

export async function countOwners(db: GlobalClient, idperusahaan: number): Promise<number> {
  const jumlah = await db.userperusahaan.count({ where: { idperusahaan, isowner: true } });

  return jumlah;
}

export async function updateIsOwner(db: GlobalClient, iduser: string, idperusahaan: number, isowner: boolean): Promise<void> {
  await db.userperusahaan.update({
    where: { iduser_idperusahaan: { iduser, idperusahaan } },
    data : { isowner },
  });
}

export function isKonflikMembership(error: unknown): boolean {
  const konflik = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

  return konflik;
}
