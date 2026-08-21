import { Prisma } from "@/lib/generated/prisma-global/client";
import type { GlobalClient, PerusahaanRow } from "@/lib/server/perusahaan/types";

const KODE_OTOMATIS_PATTERN = /^P(\d{3})$/;
export const KODE_OTOMATIS_MAKS = 999;

/** Perusahaan (dengan Keanggotaan-nya) milik satu Pengguna, kalau ada — Pengguna ini hanya
 * boleh menjadi anggota satu Perusahaan (lihat keputusan planning tiket 07). */
export async function findPerusahaanMilikUser(db: GlobalClient, iduser: string): Promise<PerusahaanRow | null> {
  const membership = await db.userperusahaan.findFirst({
    where  : { iduser },
    include: { perusahaan: true },
  });

  return membership ? toRow(membership.perusahaan) : null;
}

export async function findPerusahaanByNamadatabase(db: GlobalClient, namadatabase: string): Promise<PerusahaanRow | null> {
  const perusahaan = await db.perusahaan.findUnique({ where: { namadatabase } });
  return perusahaan ? toRow(perusahaan) : null;
}

export async function findPerusahaanByKode(db: GlobalClient, kodeperusahaan: string): Promise<PerusahaanRow | null> {
  const perusahaan = await db.perusahaan.findUnique({ where: { kodeperusahaan } });
  return perusahaan ? toRow(perusahaan) : null;
}

/** Nomor urut `P0xx` berikutnya, dihitung dari kode terbesar yang cocok pola — kode ketikan
 * Pengguna di luar pola (mis. "SM") sengaja diabaikan deret otomatis. */
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
  return max + 1;
}

/** Insert `perusahaan` + `userperusahaan` (isowner true) dalam satu transaksi — kegagalan pada
 * salah satunya membatalkan keduanya, sehingga Perusahaan tanpa Owner tidak pernah ada. */
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

  return toRow(perusahaan);
}

export function isKonflikKodeperusahaan(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (typeof target === "string") {
    return target.includes("kodeperusahaan");
  }
  if (Array.isArray(target)) {
    return target.includes("kodeperusahaan");
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
  return {
    idperusahaan  : perusahaan.idperusahaan,
    kodeperusahaan: perusahaan.kodeperusahaan,
    namaperusahaan: perusahaan.namaperusahaan,
    namadatabase  : perusahaan.namadatabase,
    status        : perusahaan.status,
  };
}
