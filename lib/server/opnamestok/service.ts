import { findBarangByKode } from "@/lib/server/barang/repository";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { insertKartuStok } from "@/lib/server/kartustok/repository";
import { deleteKartuStok, hitungSaldoStok } from "@/lib/server/kartustok/repository";
import type { InsertKartuStokBaris } from "@/lib/server/kartustok/repository";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";
import {
  findAllOpnameStok,
  findOpnameStokByKode,
  findOpnameStokInduk,
  insertOpnameStokLengkap,
  updateOpnameStokLengkap,
  updateStatusOpnameStokByKode,
  type InsertOpnameStokItemData,
} from "@/lib/server/opnamestok/repository";
import type {
  CreateOpnameStokInput,
  CreateOpnameStokItemInput,
  OpnameStok,
  UpdateOpnameStokInput,
} from "@/lib/server/opnamestok/types";

const MODUL = "OPNAME STOK";
const JENIS_KARTU_STOK = "OPNAME STOK" as const;
const PANJANG_CATATAN_MAKSIMAL = 255;

function pesanTidakDitemukan(kodeopname: string): string {
  return `Opname Stok dengan kode "${kodeopname}" tidak ditemukan`;
}

function tanggalAsiaJakarta(tanggal: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year    : "numeric",
    month   : "2-digit",
    day     : "2-digit",
  });

  return formatter.format(tanggal);
}

function cekTanggalTidakSetelahHariIni(tgltrans: Date): void {
  const hariIni = tanggalAsiaJakarta(new Date());
  const tanggalDokumen = tanggalAsiaJakarta(tgltrans);

  if (tanggalDokumen > hariIni) {
    throw new Error(
      `Tanggal dokumen ${tanggalDokumen} tidak boleh setelah hari ini (${hariIni})`,
      { cause: "INPUT_TIDAK_SAH" },
    );
  }
}

type BarisBarang = {
  idbarang  : number;
  kodebarang: string;
  namabarang: string;
  satuan    : string;
  jmlfisik  : number;
};

async function resolveBaris(
  db   : DatabasePerusahaanClient,
  items: CreateOpnameStokItemInput[],
): Promise<BarisBarang[]> {
  if (items.length === 0) {
    throw new Error("Opname Stok harus memiliki minimal 1 baris barang", { cause: "INPUT_TIDAK_SAH" });
  }

  const hasil: BarisBarang[] = [];
  const terlihat = new Set<string>();

  for (const item of items) {
    if (terlihat.has(item.kodebarang)) {
      throw new Error(`Barang dengan kode "${item.kodebarang}" muncul lebih dari sekali dalam dokumen`, { cause: "INPUT_TIDAK_SAH" });
    }
    terlihat.add(item.kodebarang);

    if (!(item.jmlfisik >= 0)) {
      throw new Error(`Jumlah fisik barang "${item.kodebarang}" tidak boleh negatif`, { cause: "INPUT_TIDAK_SAH" });
    }

    const barang = await findBarangByKode(db, item.kodebarang);
    if (!barang) {
      throw new Error(`Barang dengan kode "${item.kodebarang}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
    }
    if (!barang.pakaistok) {
      throw new Error(`Barang dengan kode "${item.kodebarang}" tidak memakai stok, tidak bisa masuk Opname Stok`, { cause: "INPUT_TIDAK_SAH" });
    }
    if (barang.status !== 1) {
      throw new Error(`Barang dengan kode "${item.kodebarang}" nonaktif, tidak bisa masuk Opname Stok`, { cause: "INPUT_TIDAK_SAH" });
    }

    hasil.push({
      idbarang  : barang.idbarang,
      kodebarang: barang.kodebarang,
      namabarang: barang.namabarang,
      satuan    : barang.satuan,
      jmlfisik  : item.jmlfisik,
    });
  }

  return hasil;
}

type BarisTerhitung = BarisBarang & { jmlsistem: number; selisih: number };

function hitungSelisih(baris: BarisBarang[], saldoPerBarang: Map<number, number>): BarisTerhitung[] {
  return baris.map((item) => {
    const jmlsistem = saldoPerBarang.get(item.idbarang) ?? 0;
    const selisih = Math.round((item.jmlfisik - jmlsistem) * 100) / 100;

    return { ...item, jmlsistem, selisih };
  });
}

function toInsertItems(baris: BarisTerhitung[]): InsertOpnameStokItemData[] {
  return baris.map((item) => ({
    idbarang : item.idbarang,
    satuan   : item.satuan,
    jmlsistem: item.jmlsistem,
    jmlfisik : item.jmlfisik,
    selisih  : item.selisih,
  }));
}

function catatanKartuStok(namabarang: string): string {
  return `OPNAME STOK ${namabarang}`.toUpperCase().slice(0, PANJANG_CATATAN_MAKSIMAL);
}

type KepalaKartuStok = {
  idopnamestok: number;
  kodeopname  : string;
  tgltrans    : Date;
  idlokasi    : number;
};

async function terbitkanKartuStok(
  db    : DatabasePerusahaanClient,
  kepala: KepalaKartuStok,
  baris : BarisTerhitung[],
): Promise<void> {
  const barisKartuStok: InsertKartuStokBaris[] = baris
    .filter((item) => item.selisih !== 0)
    .map((item) => ({
      idbarang: item.idbarang,
      jml     : Math.abs(item.selisih),
      mk      : item.selisih > 0 ? "M" : "K",
      catatan : catatanKartuStok(item.namabarang),
    }));

  await insertKartuStok(
    db,
    {
      jenistransaksi: JENIS_KARTU_STOK,
      idtrans       : kepala.idopnamestok,
      kodetrans     : kepala.kodeopname,
      tgltrans      : kepala.tgltrans,
      idlokasi      : kepala.idlokasi,
    },
    barisKartuStok,
  );
}

/**
 * Membekukan `jmlsistem` dari saldo terkini (ADR 0008). Pada edit, pemanggil wajib sudah mencabut
 * Kartu Stok lama sebelum memanggil ini agar saldo tidak memuat hasil dokumen itu sendiri.
 */
async function bekukanSelisih(
  tx      : DatabasePerusahaanClient,
  idlokasi: number,
  tgltrans: Date,
  baris   : BarisBarang[],
): Promise<BarisTerhitung[]> {
  const saldo = await hitungSaldoStok(tx, idlokasi, tgltrans);
  const saldoPerBarang = new Map(saldo.map((item) => [item.idbarang, item.jmlsistem]));

  return hitungSelisih(baris, saldoPerBarang);
}

export async function listOpnameStok(db: DatabasePerusahaanClient): Promise<OpnameStok[]> {
  const rows = await findAllOpnameStok(db);

  return rows;
}

export async function findOpnameStok(db: DatabasePerusahaanClient, kodeopname: string): Promise<OpnameStok | null> {
  const row = await findOpnameStokByKode(db, kodeopname);

  return row;
}

export async function createOpnameStok(db: DatabasePerusahaanClient, input: CreateOpnameStokInput): Promise<OpnameStok> {
  const tgltrans = new Date(input.tanggal);
  cekTanggalTidakSetelahHariIni(tgltrans);

  const lokasi = await findLokasiByKode(db, input.kodelokasi);
  if (!lokasi) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (lokasi.status !== 1) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  const baris = await resolveBaris(db, input.items);

  const kodeopname = await db.$transaction(async (tx) => {
    const kode = await simpanDenganKode(tx, MODUL, tgltrans, async (kode) => {
      const terhitung = await bekukanSelisih(tx, lokasi.idlokasi, tgltrans, baris);

      const idopnamestok = await insertOpnameStokLengkap(tx, kode, {
        tgltrans,
        idlokasi: lokasi.idlokasi,
        items   : toInsertItems(terhitung),
      });

      await terbitkanKartuStok(
        tx,
        { idopnamestok, kodeopname: kode, tgltrans, idlokasi: lokasi.idlokasi },
        terhitung,
      );

      return kode;
    });

    return kode;
  });

  const created = await findOpnameStokByKode(db, kodeopname);

  return created!;
}

export async function updateOpnameStok(
  db        : DatabasePerusahaanClient,
  kodeopname: string,
  input     : UpdateOpnameStokInput,
): Promise<OpnameStok> {
  const induk = await findOpnameStokInduk(db, kodeopname);
  if (!induk) {
    throw new Error(pesanTidakDitemukan(kodeopname), { cause: "TIDAK_DITEMUKAN" });
  }
  if (induk.status === "D") {
    throw new Error(`Opname Stok "${kodeopname}" sudah dibatalkan, tidak bisa diedit`, { cause: "SUDAH_DIBATALKAN" });
  }

  const baris = await resolveBaris(db, input.items);

  await db.$transaction(async (tx) => {
    await deleteKartuStok(tx, JENIS_KARTU_STOK, induk.idopnamestok);

    const terhitung = await bekukanSelisih(tx, induk.idlokasi, induk.tgltrans, baris);

    await updateOpnameStokLengkap(tx, induk.idopnamestok, toInsertItems(terhitung));

    await terbitkanKartuStok(
      tx,
      { idopnamestok: induk.idopnamestok, kodeopname, tgltrans: induk.tgltrans, idlokasi: induk.idlokasi },
      terhitung,
    );
  });

  const terbaru = await findOpnameStokByKode(db, kodeopname);

  return terbaru!;
}

export async function cancelOpnameStok(
  db        : DatabasePerusahaanClient,
  kodeopname: string,
  alasan?   : string,
): Promise<OpnameStok> {
  const induk = await findOpnameStokInduk(db, kodeopname);
  if (!induk) {
    throw new Error(pesanTidakDitemukan(kodeopname), { cause: "TIDAK_DITEMUKAN" });
  }
  if (induk.status === "D") {
    throw new Error(`Opname Stok "${kodeopname}" sudah dibatalkan`, { cause: "SUDAH_DIBATALKAN" });
  }

  await db.$transaction(async (tx) => {
    const idopnamestok = await updateStatusOpnameStokByKode(tx, kodeopname, alasan?.trim() || null);

    await deleteKartuStok(tx, JENIS_KARTU_STOK, idopnamestok);
  });

  const updated = await findOpnameStokByKode(db, kodeopname);

  return updated!;
}
