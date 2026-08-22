import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import { findConfigForModul, findKodeByPrefix, MODUL_KODE_FIELD } from "@/lib/server/kodedokumen/repository";
import { MODUL_KODE_DOKUMEN, type KonfigurasiKodeDokumen, type ModulKodeDokumen } from "@/lib/server/kodedokumen/types";
import type { TenantClient } from "@/lib/server/provisioning/types";

export class ModulTidakDikenalError extends Error {}
export class ConfigKodeDokumenTidakValidError extends Error {}
export class PercobaanKodeDokumenHabisError extends Error {}

const MAX_PERCOBAAN = 50;

function isModulKodeDokumen(modul: string): modul is ModulKodeDokumen {
  return (MODUL_KODE_DOKUMEN as readonly string[]).includes(modul);
}

function periodeAsiaJakarta(tgltrans: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year    : "2-digit",
    month   : "2-digit",
    day     : "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(tgltrans).map((part) => [part.type, part.value]));
  return `${parts.year}${parts.month}${parts.day}`;
}

async function bacaConfigModul(db: TenantClient, modul: ModulKodeDokumen): Promise<KonfigurasiKodeDokumen> {
  const rows = await findConfigForModul(db, modul);
  if (rows.length === 0) {
    throw new ConfigKodeDokumenTidakValidError(`Config Kode Dokumen untuk modul "${modul}" tidak ditemukan`);
  }

  const nilai = Object.fromEntries(rows.map((row) => [row.config, row.nilai]));

  const awalan = nilai.awalan?.trim();
  if (!awalan) {
    throw new ConfigKodeDokumenTidakValidError(`Config "awalan" untuk modul "${modul}" kosong atau tidak ditemukan`);
  }

  const pakaitanggal = nilai.pakaitanggal;
  if (pakaitanggal !== "0" && pakaitanggal !== "1") {
    throw new ConfigKodeDokumenTidakValidError(
      `Config "pakaitanggal" untuk modul "${modul}" harus "0" atau "1"`,
    );
  }

  const panjangnomor = Number(nilai.panjangnomor);
  if (!nilai.panjangnomor || !Number.isInteger(panjangnomor) || panjangnomor <= 0) {
    throw new ConfigKodeDokumenTidakValidError(
      `Config "panjangnomor" untuk modul "${modul}" harus bilangan bulat positif`,
    );
  }

  return { awalan, pakaitanggal, panjangnomor };
}

async function nomorBerikutnya(db: TenantClient, modul: ModulKodeDokumen, prefix: string): Promise<number> {
  const existing = await findKodeByPrefix(db, modul, prefix);

  let max = 0;
  for (const kode of existing) {
    const nomor = Number(kode.slice(prefix.length));
    if (Number.isFinite(nomor) && nomor > max) {
      max = nomor;
    }
  }
  return max + 1;
}

function isKonflikKode(error: unknown, kolomKode: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (typeof target === "string") {
    return target.includes(kolomKode);
  }
  if (Array.isArray(target)) {
    return target.includes(kolomKode);
  }
  return true;
}

export async function simpanDenganKode<T>(
  db      : TenantClient,
  modul   : string,
  tgltrans: Date,
  simpan  : (kode: string) => Promise<T>,
): Promise<T> {
  if (!isModulKodeDokumen(modul)) {
    throw new ModulTidakDikenalError(`Modul "${modul}" tidak dikenal generator Kode Dokumen`);
  }

  const config = await bacaConfigModul(db, modul);
  const prefix = config.pakaitanggal === "1" ? `${config.awalan}${periodeAsiaJakarta(tgltrans)}` : config.awalan;

  let nomor = await nomorBerikutnya(db, modul, prefix);
  const kolomKode = MODUL_KODE_FIELD[modul];

  for (let percobaan = 0; percobaan < MAX_PERCOBAAN; percobaan++) {
    const kode = `${prefix}${String(nomor).padStart(config.panjangnomor, "0")}`;

    try {
      return await simpan(kode);
    } catch (error) {
      if (!isKonflikKode(error, kolomKode)) {
        throw error;
      }
      nomor += 1;
    }
  }

  throw new PercobaanKodeDokumenHabisError(
    `Gagal mendapatkan Kode Dokumen untuk modul "${modul}" setelah ${MAX_PERCOBAAN} percobaan`,
  );
}
