import {
  findAllConfig,
  findConfigRowsByModul,
  upsertConfigRow,
  upsertManyConfigRows,
} from "@/lib/server/config/repository";
import type { ConfigRow, ItemConfig, KelompokConfig, Tema, UpdateConfigInput } from "@/lib/server/config/types";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { KODE_DOKUMEN_MODULES } from "@/lib/server/databaseperusahaan/service";
import { MODUL_KODE_DOKUMEN } from "@/lib/server/kodedokumen/types";

type ValidasiNilai = (nilai: string) => string | null;

const POLA_AWALAN = /^[A-Za-z0-9-]+$/;
const POLA_ANGKA_BULAT = /^\d+$/;
const POLA_DESIMAL = /^\d+(\.\d+)?$/;

const LEBAR_KOLOM_KODE: Record<string, number> = {
  LOKASI  : 20,
  BARANG  : 20,
  CUSTOMER: 20,
  SUPPLIER: 20,
  JUAL    : 30,
  BELI    : 30,
  KAS     : 30,
};

const KUNCI_KODE_DOKUMEN: Record<string, ValidasiNilai> = {
  AWALAN      : validasiAwalan,
  PAKAITANGGAL: validasiPakaitanggal,
  PANJANGNOMOR: validasiPanjangnomor,
};

const REGISTRY_CONFIG: Record<string, Record<string, ValidasiNilai>> = {
  ...Object.fromEntries(MODUL_KODE_DOKUMEN.map((modul) => [modul, KUNCI_KODE_DOKUMEN])),
  PPN     : { PERSENTASE: validasiPersentase, STATUS: validasiStatus },
  TAMPILAN: { TEMA: validasiTema },
};

function validasiAwalan(nilai: string): string | null {
  if (!nilai) {
    return "awalan tidak boleh kosong";
  }
  if (!POLA_AWALAN.test(nilai)) {
    return "awalan hanya boleh berisi huruf, angka, dan tanda hubung";
  }

  return null;
}

function validasiPakaitanggal(nilai: string): string | null {
  if (nilai !== "0" && nilai !== "1") {
    return "pakaitanggal harus \"0\" atau \"1\"";
  }

  return null;
}

function validasiPanjangnomor(nilai: string): string | null {
  if (!POLA_ANGKA_BULAT.test(nilai) || Number(nilai) <= 0) {
    return "panjangnomor harus bilangan bulat positif";
  }

  return null;
}

function validasiPersentase(nilai: string): string | null {
  if (!POLA_DESIMAL.test(nilai) || Number(nilai) < 0 || Number(nilai) > 100) {
    return "persentase harus angka antara 0 sampai 100";
  }

  return null;
}

function validasiStatus(nilai: string): string | null {
  if (nilai !== "0" && nilai !== "1") {
    return "status harus \"0\" atau \"1\"";
  }

  return null;
}

function validasiTema(nilai: string): string | null {
  if (nilai !== "LIGHT" && nilai !== "DARK") {
    return "tema harus \"LIGHT\" atau \"DARK\"";
  }

  return null;
}

function toUpperTrim(nilai: string): string {
  const hasil = nilai.trim().toUpperCase();

  return hasil;
}

function findValidasiKunci(modul: string, config: string): ValidasiNilai {
  const aturan = REGISTRY_CONFIG[modul];
  if (!aturan) {
    throw new Error(`Modul "${modul}" tidak dikenal pada daftar Config`, { cause: "INPUT_TIDAK_SAH" });
  }

  const validasi = aturan[config];
  if (!validasi) {
    throw new Error(`Kunci "${config}" tidak dikenal pada modul "${modul}"`, { cause: "INPUT_TIDAK_SAH" });
  }

  return validasi;
}

function jalankanValidasi(modul: string, config: string, nilai: string): void {
  const pesan = findValidasiKunci(modul, config)(nilai);
  if (pesan) {
    throw new Error(`Nilai untuk modul "${modul}", kunci "${config}" tidak sah: ${pesan}`, {
      cause: "INPUT_TIDAK_SAH",
    });
  }
}

function cekPanjangKode(modul: string, awalan: string, pakaitanggal: string, panjangnomor: string): void {
  const lebar = LEBAR_KOLOM_KODE[modul];
  if (!lebar) {
    return;
  }

  const totalKarakter = awalan.length + (pakaitanggal === "1" ? 6 : 0) + Number(panjangnomor);
  if (totalKarakter > lebar) {
    throw new Error(
      `Kombinasi Config modul "${modul}" menghasilkan kode ${totalKarakter} karakter dan melebihi batas panjang kode kolomnya ${lebar} karakter`,
      { cause: "INPUT_TIDAK_SAH" },
    );
  }
}

/**
 * Cek panjang Kode Dokumen setelah `perubahan` diterapkan di atas nilai tersimpan
 * (atau nilai bawaan bila baris belum ada). Dipakai baik oleh update satu kunci
 * maupun update satu modul sekaligus.
 */
async function cekPanjangKodeDenganPerubahan(
  db       : DatabasePerusahaanClient,
  modul    : string,
  perubahan: ItemConfig[],
): Promise<void> {
  if (!LEBAR_KOLOM_KODE[modul]) {
    return;
  }

  const rows = await findConfigRowsByModul(db, modul);
  const nilai = Object.fromEntries(rows.map((row) => [row.config, row.nilai]));
  for (const item of perubahan) {
    nilai[item.config] = item.nilai;
  }
  const bawaan = KODE_DOKUMEN_MODULES[modul];

  cekPanjangKode(
    modul,
    nilai.AWALAN ?? bawaan.awalan,
    nilai.PAKAITANGGAL ?? bawaan.pakaitanggal,
    nilai.PANJANGNOMOR ?? bawaan.panjangnomor,
  );
}

export async function listConfig(db: DatabasePerusahaanClient): Promise<KelompokConfig[]> {
  const rows = await findAllConfig(db);
  const kelompok = new Map<string, KelompokConfig>();

  for (const row of rows) {
    let grup = kelompok.get(row.modul);
    if (!grup) {
      grup = { modul: row.modul, items: [] };
      kelompok.set(row.modul, grup);
    }
    grup.items.push({ config: row.config, nilai: row.nilai });
  }

  return [...kelompok.values()];
}

export async function updateConfig(db: DatabasePerusahaanClient, input: UpdateConfigInput): Promise<ConfigRow> {
  const modul = toUpperTrim(input.modul);
  const config = toUpperTrim(input.config);
  const nilai = toUpperTrim(input.nilai);

  jalankanValidasi(modul, config, nilai);
  await cekPanjangKodeDenganPerubahan(db, modul, [{ config, nilai }]);

  const row = await upsertConfigRow(db, modul, config, nilai);

  return row;
}

export async function updateConfigModul(
  db   : DatabasePerusahaanClient,
  modul: string,
  items: ItemConfig[],
): Promise<ConfigRow[]> {
  const modulNorm = toUpperTrim(modul);
  const itemsNorm = items.map((item) => ({ config: toUpperTrim(item.config), nilai: toUpperTrim(item.nilai) }));

  for (const item of itemsNorm) {
    jalankanValidasi(modulNorm, item.config, item.nilai);
  }
  await cekPanjangKodeDenganPerubahan(db, modulNorm, itemsNorm);

  const hasil = await upsertManyConfigRows(db, modulNorm, itemsNorm);

  return hasil;
}

export async function bacaTema(db: DatabasePerusahaanClient): Promise<Tema> {
  const rows = await findConfigRowsByModul(db, "TAMPILAN");
  const tema = rows.find((row) => row.config === "TEMA");

  if (tema?.nilai === "LIGHT" || tema?.nilai === "DARK") {
    return tema.nilai;
  }

  return "LIGHT";
}
