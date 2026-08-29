import { Prisma } from "@/lib/generated/prisma-global/client";
import type { GlobalClient, PerusahaanRow } from "@/lib/server/perusahaan/types";

const KODE_OTOMATIS_PATTERN = /^P(\d{3})$/;
export const KODE_OTOMATIS_MAKS = 999;

export async function findPerusahaanMilikUser(db: GlobalClient, iduser: string): Promise<PerusahaanRow | null> {
  const membership = await db.userperusahaan.findFirst({
    where  : { iduser },
    include: { perusahaan: true },
  });

  const row = membership ? toRow(membership.perusahaan) : null;

  return row;
}

export async function findPerusahaanByNamadatabase(db: GlobalClient, namadatabase: string): Promise<PerusahaanRow | null> {
  const perusahaan = await db.perusahaan.findUnique({ where: { namadatabase } });
  const row = perusahaan ? toRow(perusahaan) : null;

  return row;
}

export async function findPerusahaanByKode(db: GlobalClient, kodeperusahaan: string): Promise<PerusahaanRow | null> {
  const perusahaan = await db.perusahaan.findUnique({ where: { kodeperusahaan } });
  const row = perusahaan ? toRow(perusahaan) : null;

  return row;
}

export async function findMembership(
  db          : GlobalClient,
  iduser      : string,
  idperusahaan: number,
): Promise<{ iduser: string; idperusahaan: number } | null> {
  const membership = await db.userperusahaan.findUnique({
    where: { iduser_idperusahaan: { iduser, idperusahaan } },
  });

  return membership;
}

export async function findMembershipDenganOwner(
  db          : GlobalClient,
  iduser      : string,
  idperusahaan: number,
): Promise<{ isowner: boolean } | null> {
  const membership = await db.userperusahaan.findUnique({
    where : { iduser_idperusahaan: { iduser, idperusahaan } },
    select: { isowner: true },
  });

  return membership;
}

export async function setSessionPerusahaanAktif(db: GlobalClient, idsesi: string, idperusahaan: number): Promise<void> {
  await db.session.update({ where: { id: idsesi }, data: { idperusahaan } });
}

export async function findNamadatabaseAktif(db: GlobalClient, idperusahaan: number): Promise<string | null> {
  const perusahaan = await db.perusahaan.findUnique({ where: { idperusahaan }, select: { namadatabase: true } });

  return perusahaan?.namadatabase ?? null;
}

export async function findNamaperusahaanAktif(db: GlobalClient, idperusahaan: number): Promise<string | null> {
  const perusahaan = await db.perusahaan.findUnique({ where: { idperusahaan }, select: { namaperusahaan: true } });

  return perusahaan?.namaperusahaan ?? null;
}

export async function nomorKodeOtomatisBerikutnya(db: GlobalClient): Promise<number> {
  const rows = await db.perusahaan.findMany({ select: { kodeperusahaan: true } });

  let max = 0;
  for (const row of rows) {
    const match = KODE_OTOMATIS_PATTERN.exec(row.kodeperusahaan);
    if (match) {
      const nomor = Number(match[1]);
      if (nomor > max) {
        max = nomor;
      }
    }
  }

  const nomorBerikutnya = max + 1;

  return nomorBerikutnya;
}

export async function insertPerusahaanDenganOwner(
  db            : GlobalClient,
  iduser        : string,
  kodeperusahaan: string,
  namaperusahaan: string,
  namadatabase  : string,
): Promise<PerusahaanRow> {
  const perusahaan = await db.$transaction(async (tx) => {
    const created = await tx.perusahaan.create({ data: { kodeperusahaan, namaperusahaan, namadatabase } });
    await tx.userperusahaan.create({ data: { iduser, idperusahaan: created.idperusahaan, isowner: true } });

    return created;
  });

  const row = toRow(perusahaan);

  return row;
}

export function isKonflikKodeperusahaan(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (typeof target === "string") {
    const cocok = target.includes("kodeperusahaan");

    return cocok;
  }
  if (Array.isArray(target)) {
    const cocok = target.includes("kodeperusahaan");

    return cocok;
  }

  return true;
}

function toRow(perusahaan: {
  idperusahaan  : number;
  kodeperusahaan: string;
  namaperusahaan: string;
  namadatabase  : string;
  status        : number;
}): PerusahaanRow {
  const row = {
    idperusahaan  : perusahaan.idperusahaan,
    kodeperusahaan: perusahaan.kodeperusahaan,
    namaperusahaan: perusahaan.namaperusahaan,
    namadatabase  : perusahaan.namadatabase,
    status        : perusahaan.status,
  };

  return row;
}
