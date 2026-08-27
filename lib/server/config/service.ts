import {
  findAllConfig,
  findConfigRowsByModul,
  upsertConfigRow,
} from "@/lib/server/config/repository";
import type { ConfigRow, KelompokConfig, Tema, UpdateConfigInput } from "@/lib/server/config/types";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { KODE_DOKUMEN_MODULES } from "@/lib/server/databaseperusahaan/service";
import { MODUL_KODE_DOKUMEN } from "@/lib/server/kodedokumen/types";

type ValidasiNilai = (nilai: string) => string | null;

const POLA_AWALAN = /^[A-Za-z0-9-]+$/;
const POLA_ANGKA_BULAT = /^\d+$/;
const POLA_DESIMAL = /^\d+(\.\d+)?$/;

const LEBAR_KOLOM_KODE: Record<string, number> = {
  lokasi  : 20,
  barang  : 20,
  customer: 20,
  supplier: 20,
  jual    : 30,
  beli    : 30,
  kas     : 30,
};

const KUNCI_KODE_DOKUMEN: Record<string, ValidasiNilai> = {
  awalan      : validasiAwalan,
  pakaitanggal: validasiPakaitanggal,
  panjangnomor: validasiPanjangnomor,
};

const REGISTRY_CONFIG: Record<string, Record<string, ValidasiNilai>> = {
  ...Object.fromEntries(MODUL_KODE_DOKUMEN.map((modul) => [modul, KUNCI_KODE_DOKUMEN])),
  ppn     : { persentase: validasiPersentase, status: validasiStatus },
  tampilan: { tema: validasiTema },
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
  if (nilai !== "terang" && nilai !== "gelap") {
    return "tema harus \"terang\" atau \"gelap\"";
  }

  return null;
}

async function cekPanjangKodeMuat(
  db       : DatabasePerusahaanClient,
  modul    : string,
  config   : string,
  nilaiBaru: string,
): Promise<void> {
  const lebar = LEBAR_KOLOM_KODE[modul];
  if (!lebar) {
    return;
  }

  const rows = await findConfigRowsByModul(db, modul);
  const nilaiTersimpan = Object.fromEntries(rows.map((row) => [row.config, row.nilai]));
  const formatBawaan = KODE_DOKUMEN_MODULES[modul];

  const awalan = config === "awalan" ? nilaiBaru : (nilaiTersimpan.awalan ?? formatBawaan.awalan);
  const pakaitanggal =
    config === "pakaitanggal" ? nilaiBaru : (nilaiTersimpan.pakaitanggal ?? formatBawaan.pakaitanggal);
  const panjangnomor =
    config === "panjangnomor" ? nilaiBaru : (nilaiTersimpan.panjangnomor ?? formatBawaan.panjangnomor);

  const totalKarakter = awalan.length + (pakaitanggal === "1" ? 6 : 0) + Number(panjangnomor);
  if (totalKarakter > lebar) {
    throw new Error(
      `Kombinasi Config modul "${modul}" menghasilkan kode ${totalKarakter} karakter dan melebihi batas panjang kode kolomnya ${lebar} karakter`,
      { cause: "INPUT_TIDAK_SAH" },
    );
  }
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
  const modul = input.modul.trim();
  const config = input.config.trim();
  const nilai = input.nilai.trim();

  const aturan = REGISTRY_CONFIG[modul];
  if (!aturan) {
    throw new Error(`Modul "${modul}" tidak dikenal pada daftar Config`, { cause: "INPUT_TIDAK_SAH" });
  }

  const validasi = aturan[config];
  if (!validasi) {
    throw new Error(`Kunci "${config}" tidak dikenal pada modul "${modul}"`, { cause: "INPUT_TIDAK_SAH" });
  }

  const pesan = validasi(nilai);
  if (pesan) {
    throw new Error(`Nilai untuk modul "${modul}", kunci "${config}" tidak sah: ${pesan}`, {
      cause: "INPUT_TIDAK_SAH",
    });
  }

  await cekPanjangKodeMuat(db, modul, config, nilai);

  const row = await upsertConfigRow(db, modul, config, nilai);

  return row;
}

export async function bacaTema(db: DatabasePerusahaanClient): Promise<Tema> {
  const rows = await findConfigRowsByModul(db, "tampilan");
  const tema = rows.find((row) => row.config === "tema");

  if (tema?.nilai === "terang" || tema?.nilai === "gelap") {
    return tema.nilai;
  }

  return "terang";
}
