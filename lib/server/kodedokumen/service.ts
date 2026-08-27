import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import { findConfigForModul, findKodeByPrefix, MODUL_KODE_FIELD } from "@/lib/server/kodedokumen/repository";
import { MODUL_KODE_DOKUMEN, type KonfigurasiKodeDokumen, type ModulKodeDokumen } from "@/lib/server/kodedokumen/types";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";

const MAX_PERCOBAAN = 50;

function isModulKodeDokumen(modul: string): modul is ModulKodeDokumen {
  const dikenal = (MODUL_KODE_DOKUMEN as readonly string[]).includes(modul);

  return dikenal;
}

function periodeAsiaJakarta(tgltrans: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year    : "2-digit",
    month   : "2-digit",
    day     : "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(tgltrans).map((part) => [part.type, part.value]));
  const periode = `${parts.year}${parts.month}${parts.day}`;

  return periode;
}

async function bacaConfigModul(db: DatabasePerusahaanClient, modul: ModulKodeDokumen): Promise<KonfigurasiKodeDokumen> {
  const rows = await findConfigForModul(db, modul);
  if (rows.length === 0) {
    throw new Error(`Config Kode Dokumen untuk modul "${modul}" tidak ditemukan`);
  }

  const nilai = Object.fromEntries(rows.map((row) => [row.config, row.nilai]));

  const awalan = nilai.AWALAN?.trim();
  if (!awalan) {
    throw new Error(`Config "AWALAN" untuk modul "${modul}" kosong atau tidak ditemukan`);
  }

  const pakaitanggal = nilai.PAKAITANGGAL;
  if (pakaitanggal !== "0" && pakaitanggal !== "1") {
    throw new Error(`Config "PAKAITANGGAL" untuk modul "${modul}" harus "0" atau "1"`);
  }

  const panjangnomor = Number(nilai.PANJANGNOMOR);
  if (!nilai.PANJANGNOMOR || !Number.isInteger(panjangnomor) || panjangnomor <= 0) {
    throw new Error(`Config "PANJANGNOMOR" untuk modul "${modul}" harus bilangan bulat positif`);
  }

  const config: KonfigurasiKodeDokumen = { awalan, pakaitanggal, panjangnomor };

  return config;
}

async function nomorBerikutnya(db: DatabasePerusahaanClient, modul: ModulKodeDokumen, prefix: string): Promise<number> {
  const existing = await findKodeByPrefix(db, modul, prefix);

  let max = 0;
  for (const kode of existing) {
    const nomor = Number(kode.slice(prefix.length));
    if (Number.isFinite(nomor) && nomor > max) {
      max = nomor;
    }
  }

  const berikutnya = max + 1;

  return berikutnya;
}

function isKonflikKode(error: unknown, kolomKode: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (typeof target === "string") {
    const cocok = target.includes(kolomKode);

    return cocok;
  }
  if (Array.isArray(target)) {
    const cocok = target.includes(kolomKode);

    return cocok;
  }

  return true;
}

export async function simpanDenganKode<T>(
  db      : DatabasePerusahaanClient,
  modul   : string,
  tgltrans: Date,
  simpan  : (kode: string) => Promise<T>,
): Promise<T> {
  const modulKode = modul.toUpperCase();
  if (!isModulKodeDokumen(modulKode)) {
    throw new Error(`Modul "${modul}" tidak dikenal generator Kode Dokumen`);
  }

  const config = await bacaConfigModul(db, modulKode);
  const prefix = config.pakaitanggal === "1" ? `${config.awalan}${periodeAsiaJakarta(tgltrans)}` : config.awalan;

  let nomor = await nomorBerikutnya(db, modulKode, prefix);
  const kolomKode = MODUL_KODE_FIELD[modulKode];

  for (let percobaan = 0; percobaan < MAX_PERCOBAAN; percobaan++) {
    const kode = `${prefix}${String(nomor).padStart(config.panjangnomor, "0")}`;

    try {
      const hasil = await simpan(kode);

      return hasil;
    } catch (error) {
      if (!isKonflikKode(error, kolomKode)) {
        throw error;
      }
      nomor += 1;
    }
  }

  throw new Error(`Gagal mendapatkan Kode Dokumen untuk modul "${modul}" setelah ${MAX_PERCOBAAN} percobaan`);
}
