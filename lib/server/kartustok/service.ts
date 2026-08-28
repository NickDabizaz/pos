import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { buatCatatanKartuStok } from "@/lib/server/kartustok/catatan";
import { hitungSaldoStok, insertKartuStok } from "@/lib/server/kartustok/repository";
import type { InsertKartuStokBaris, KepalaTransaksi, SaldoStokBarang } from "@/lib/server/kartustok/repository";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";
import type { JenisTransaksiStok, MasukKeluar } from "@/lib/server/kartustok/types";
import type { JenisTransaksiPenjualan } from "@/lib/server/penjualan/types";

export type { SaldoStokBarang };

/**
 * Saldo stok terpublikasi untuk satu Lokasi pada satu tanggal. Endpoint saldo stok berdiri
 * sendiri — bukan milik Opname Stok — dan menjadi fondasi laporan Kartu Stok nanti.
 */
export async function bacaSaldoStok(
  db        : DatabasePerusahaanClient,
  kodelokasi: string,
  tanggal   : Date,
): Promise<SaldoStokBarang[]> {
  if (!kodelokasi.trim()) {
    throw new Error("Lokasi wajib diisi untuk membaca saldo stok", { cause: "INPUT_TIDAK_SAH" });
  }

  const lokasi = await findLokasiByKode(db, kodelokasi);
  if (!lokasi) {
    throw new Error(`Lokasi dengan kode "${kodelokasi}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }

  return hitungSaldoStok(db, lokasi.idlokasi, tanggal);
}

export function petakanJenisPenjualan(jenistransaksi: JenisTransaksiPenjualan): Extract<JenisTransaksiStok, "POS" | "PENJUALAN"> {
  const jenis = jenistransaksi === "POS" ? "POS" : "PENJUALAN";

  return jenis;
}

export type BarangTurunanInput = {
  idbarang  : number;
  namabarang: string;
  qty       : number;
  pakaistok : boolean;
};

type KepalaTurunan = {
  jenis    : JenisTransaksiStok;
  idtrans  : number;
  kodetrans: string;
  tgltrans : Date;
  idlokasi : number;
};

function susunBarisKartuStok(
  kepala   : KepalaTurunan,
  namaMitra: string,
  mk       : MasukKeluar,
  items    : BarangTurunanInput[],
): InsertKartuStokBaris[] {
  const baris = items
    .filter((item) => item.pakaistok)
    .map((item) => ({
      idbarang: item.idbarang,
      jml     : item.qty,
      mk,
      catatan :
        kepala.jenis === "PEMBELIAN"
          ? buatCatatanKartuStok({ jenistransaksi: "PEMBELIAN", namabarang: item.namabarang, namasupplier: namaMitra })
          : buatCatatanKartuStok({ jenistransaksi: kepala.jenis, namabarang: item.namabarang, namacustomer: namaMitra }),
    }));

  return baris;
}

async function tulisKartuStok(
  db       : DatabasePerusahaanClient,
  kepala   : KepalaTurunan,
  namaMitra: string,
  mk       : MasukKeluar,
  items    : BarangTurunanInput[],
): Promise<void> {
  const kepalaLengkap: KepalaTransaksi = {
    jenistransaksi: kepala.jenis,
    idtrans       : kepala.idtrans,
    kodetrans     : kepala.kodetrans,
    tgltrans      : kepala.tgltrans,
    idlokasi      : kepala.idlokasi,
  };

  await insertKartuStok(db, kepalaLengkap, susunBarisKartuStok(kepala, namaMitra, mk, items));
}

export type TransaksiPenjualanTurunan = {
  idjual        : number;
  kodejual      : string;
  tgltrans      : Date;
  idlokasi      : number;
  jenistransaksi: JenisTransaksiPenjualan;
};

export async function insertKartuStokPenjualan(
  db        : DatabasePerusahaanClient,
  transaksi : TransaksiPenjualanTurunan,
  namacustomer: string,
  items     : BarangTurunanInput[],
): Promise<void> {
  const kepala: KepalaTurunan = {
    jenis    : petakanJenisPenjualan(transaksi.jenistransaksi),
    idtrans  : transaksi.idjual,
    kodetrans: transaksi.kodejual,
    tgltrans : transaksi.tgltrans,
    idlokasi : transaksi.idlokasi,
  };

  await tulisKartuStok(db, kepala, namacustomer, "K", items);
}

export type TransaksiPembelianTurunan = {
  idbeli  : number;
  kodebeli: string;
  tgltrans: Date;
  idlokasi: number;
};

export async function insertKartuStokPembelian(
  db         : DatabasePerusahaanClient,
  transaksi  : TransaksiPembelianTurunan,
  namasupplier: string,
  items      : BarangTurunanInput[],
): Promise<void> {
  const kepala: KepalaTurunan = {
    jenis    : "PEMBELIAN",
    idtrans  : transaksi.idbeli,
    kodetrans: transaksi.kodebeli,
    tgltrans : transaksi.tgltrans,
    idlokasi : transaksi.idlokasi,
  };

  await tulisKartuStok(db, kepala, namasupplier, "M", items);
}
