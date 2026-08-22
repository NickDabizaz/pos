import {
  findPerusahaanByKode,
  findPerusahaanByNamadatabase,
  findPerusahaanMilikUser,
  insertPerusahaanDenganOwner,
  isKonflikKodeperusahaan,
  KODE_OTOMATIS_MAKS,
  nomorKodeOtomatisBerikutnya,
} from "@/lib/server/perusahaan/repository";
import type { DaftarPerusahaanDeps, DaftarPerusahaanInput, GlobalClient, PerusahaanRow } from "@/lib/server/perusahaan/types";

export class SudahMemilikiPerusahaanError extends Error {}
export class NamaPerusahaanTidakValidError extends Error {}
export class NamaPerusahaanSudahDipakaiError extends Error {}
export class KodePerusahaanBentrokError extends Error {}
export class KodePerusahaanOtomatisHabisError extends Error {}
export class ProvisioningGagalError extends Error {}

const PREFIX_DATABASE = "pos_";
const PANJANG_NAMA_DATABASE_MAKS = 64;
const MAX_PERCOBAAN_KODE = 50;

function turunkanNamaDatabase(namaperusahaan: string): string {
  const bersih = namaperusahaan.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!bersih) {
    throw new NamaPerusahaanTidakValidError("Nama Perusahaan harus memuat huruf atau angka");
  }

  const panjangMaksBersih = PANJANG_NAMA_DATABASE_MAKS - PREFIX_DATABASE.length;
  return `${PREFIX_DATABASE}${bersih.slice(0, panjangMaksBersih)}`;
}

function normalisasiKodeKetikan(kodeperusahaan: string): string {
  return kodeperusahaan.trim().toUpperCase();
}

async function jalankanProvisioning(deps: DaftarPerusahaanDeps, perusahaan: PerusahaanRow): Promise<void> {
  try {
    await deps.buatDatabase(perusahaan.namadatabase);
  } catch (error) {
    throw new ProvisioningGagalError(
      `Gagal menyiapkan Database Perusahaan untuk "${perusahaan.namaperusahaan}". Coba lagi.`,
      { cause: error },
    );
  }
}

async function daftarDenganKodeKetikan(
  db            : GlobalClient,
  input         : DaftarPerusahaanInput,
  namadatabase  : string,
): Promise<PerusahaanRow> {
  const kodeperusahaan = normalisasiKodeKetikan(input.kodeperusahaan);

  if (await findPerusahaanByKode(db, kodeperusahaan)) {
    throw new KodePerusahaanBentrokError(`Kode Perusahaan "${kodeperusahaan}" sudah dipakai`);
  }

  try {
    return await insertPerusahaanDenganOwner(db, input.iduser, kodeperusahaan, input.namaperusahaan, namadatabase);
  } catch (error) {
    if (isKonflikKodeperusahaan(error)) {
      throw new KodePerusahaanBentrokError(`Kode Perusahaan "${kodeperusahaan}" sudah dipakai`);
    }
    throw error;
  }
}

async function daftarDenganKodeOtomatis(
  db          : GlobalClient,
  input       : DaftarPerusahaanInput,
  namadatabase: string,
): Promise<PerusahaanRow> {
  let nomor = await nomorKodeOtomatisBerikutnya(db);

  for (let percobaan = 0; percobaan < MAX_PERCOBAAN_KODE; percobaan++) {
    if (nomor > KODE_OTOMATIS_MAKS) {
      throw new KodePerusahaanOtomatisHabisError(
        `Kode Perusahaan otomatis sudah habis (P001–P${KODE_OTOMATIS_MAKS})`,
      );
    }

    const kodeperusahaan = `P${String(nomor).padStart(3, "0")}`;
    try {
      return await insertPerusahaanDenganOwner(db, input.iduser, kodeperusahaan, input.namaperusahaan, namadatabase);
    } catch (error) {
      if (!isKonflikKodeperusahaan(error)) {
        throw error;
      }
      nomor += 1;
    }
  }

  throw new KodePerusahaanOtomatisHabisError("Gagal mendapatkan Kode Perusahaan otomatis setelah beberapa percobaan");
}

async function runDaftarPerusahaan(
  db  : GlobalClient,
  input: DaftarPerusahaanInput,
  deps : DaftarPerusahaanDeps,
): Promise<PerusahaanRow> {
  const namadatabase = turunkanNamaDatabase(input.namaperusahaan);

  const existing = await findPerusahaanMilikUser(db, input.iduser);
  if (existing) {
    if (existing.namadatabase === namadatabase) {
      await jalankanProvisioning(deps, existing);
      return existing;
    }
    throw new SudahMemilikiPerusahaanError("Anda sudah memiliki Perusahaan");
  }

  if (await findPerusahaanByNamadatabase(db, namadatabase)) {
    throw new NamaPerusahaanSudahDipakaiError(`Nama Perusahaan "${input.namaperusahaan}" sudah dipakai`);
  }

  const perusahaan = input.generateKode
    ? await daftarDenganKodeOtomatis(db, input, namadatabase)
    : await daftarDenganKodeKetikan(db, input, namadatabase);

  await jalankanProvisioning(deps, perusahaan);
  return perusahaan;
}

const inFlightDaftar = new Map<string, Promise<PerusahaanRow>>();

export async function daftarPerusahaan(
  db   : GlobalClient,
  input: DaftarPerusahaanInput,
  deps : DaftarPerusahaanDeps,
): Promise<PerusahaanRow> {
  const existing = inFlightDaftar.get(input.iduser);
  if (existing) {
    return existing;
  }

  const promise = runDaftarPerusahaan(db, input, deps).finally(() => {
    inFlightDaftar.delete(input.iduser);
  });
  inFlightDaftar.set(input.iduser, promise);
  return promise;
}
