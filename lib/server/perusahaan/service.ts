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

const PREFIX_DATABASE = "pos_";
const PANJANG_NAMA_DATABASE_MAKS = 64;
const MAX_PERCOBAAN_KODE = 50;

function toLowerNamaDatabase(namaperusahaan: string): string {
  const bersih = namaperusahaan.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!bersih) {
    throw new Error("Nama Perusahaan harus memuat huruf atau angka", { cause: "NAMA_TIDAK_VALID" });
  }

  const panjangMaksBersih = PANJANG_NAMA_DATABASE_MAKS - PREFIX_DATABASE.length;
  const namadatabase = `${PREFIX_DATABASE}${bersih.slice(0, panjangMaksBersih)}`;

  return namadatabase;
}

async function createDatabasePerusahaan(deps: DaftarPerusahaanDeps, perusahaan: PerusahaanRow): Promise<void> {
  try {
    await deps.buatDatabase(perusahaan.namadatabase);
  } catch {
    throw new Error(
      `Gagal menyiapkan Database Perusahaan untuk "${perusahaan.namaperusahaan}". Coba lagi.`,
      { cause: "GAGAL_SIAPKAN_DATABASE" },
    );
  }
}

async function daftarDenganKodeInputan(
  db          : GlobalClient,
  input       : DaftarPerusahaanInput,
  namadatabase: string,
): Promise<PerusahaanRow> {
  const kodeperusahaan = input.kodeperusahaan.trim().toUpperCase();

  if (await findPerusahaanByKode(db, kodeperusahaan)) {
    throw new Error(`Kode Perusahaan "${kodeperusahaan}" sudah dipakai`, { cause: "KODE_BENTROK" });
  }

  try {
    const perusahaan = await insertPerusahaanDenganOwner(db, input.iduser, kodeperusahaan, input.namaperusahaan, namadatabase);

    return perusahaan;
  } catch (error) {
    if (isKonflikKodeperusahaan(error)) {
      throw new Error(`Kode Perusahaan "${kodeperusahaan}" sudah dipakai`, { cause: "KODE_BENTROK" });
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
      throw new Error(
        `Kode Perusahaan otomatis sudah habis (P001–P${KODE_OTOMATIS_MAKS})`,
        { cause: "KODE_OTOMATIS_HABIS" },
      );
    }

    const kodeperusahaan = `P${String(nomor).padStart(3, "0")}`;
    try {
      const perusahaan = await insertPerusahaanDenganOwner(db, input.iduser, kodeperusahaan, input.namaperusahaan, namadatabase);

      return perusahaan;
    } catch (error) {
      if (!isKonflikKodeperusahaan(error)) {
        throw error;
      }
      nomor += 1;
    }
  }

  throw new Error(
    "Gagal mendapatkan Kode Perusahaan otomatis setelah beberapa percobaan",
    { cause: "KODE_OTOMATIS_HABIS" },
  );
}

async function runDaftarPerusahaan(
  db   : GlobalClient,
  input: DaftarPerusahaanInput,
  deps : DaftarPerusahaanDeps,
): Promise<PerusahaanRow> {
  const namadatabase = toLowerNamaDatabase(input.namaperusahaan);

  const existing = await findPerusahaanMilikUser(db, input.iduser);
  if (existing) {
    if (existing.namadatabase === namadatabase) {
      await createDatabasePerusahaan(deps, existing);

      return existing;
    }
    throw new Error("Anda sudah memiliki Perusahaan", { cause: "SUDAH_MEMILIKI_PERUSAHAAN" });
  }

  if (await findPerusahaanByNamadatabase(db, namadatabase)) {
    throw new Error(`Nama Perusahaan "${input.namaperusahaan}" sudah dipakai`, { cause: "NAMA_SUDAH_DIPAKAI" });
  }

  const perusahaan = input.generateKode
    ? await daftarDenganKodeOtomatis(db, input, namadatabase)
    : await daftarDenganKodeInputan(db, input, namadatabase);

  await createDatabasePerusahaan(deps, perusahaan);

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
