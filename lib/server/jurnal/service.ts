import type { JenisKas } from "@/lib/server/kas/types";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { insertJurnal } from "@/lib/server/jurnal/repository";
import type { InsertJurnalBaris } from "@/lib/server/jurnal/repository";
import { buatCatatanJurnal } from "@/lib/server/jurnal/catatan";
import type { SaldoJurnal } from "@/lib/server/jurnal/types";
import { petakanJenisPenjualan } from "@/lib/server/kartustok/service";

type KepalaTurunan = {
  idtrans  : number;
  kodetrans: string;
  tgltrans : Date;
  idlokasi : number;
};

async function tulisJurnalGrandtotal(
  db        : DatabasePerusahaanClient,
  jenis     : "POS" | "PENJUALAN" | "PEMBELIAN",
  kepala    : KepalaTurunan,
  grandtotal: number,
  namaMitra : string,
): Promise<void> {
  const catatan =
    jenis === "PEMBELIAN"
      ? buatCatatanJurnal({ jenistransaksi: "PEMBELIAN", namasupplier: namaMitra })
      : buatCatatanJurnal({ jenistransaksi: jenis, namacustomer: namaMitra });

  const baris: InsertJurnalBaris[] = [
    { saldo: "DEBET", amount: grandtotal, catatan },
    { saldo: "KREDIT", amount: grandtotal, catatan },
  ];

  await insertJurnal(db, { jenistransaksi: jenis, ...kepala }, baris);
}

export type TransaksiPenjualanTurunan = {
  idjual        : number;
  kodejual      : string;
  tgltrans      : Date;
  idlokasi      : number;
  jenistransaksi: "POS" | "PESANAN";
};

export async function insertJurnalPenjualan(
  db          : DatabasePerusahaanClient,
  transaksi   : TransaksiPenjualanTurunan,
  namacustomer: string,
  grandtotal  : number,
): Promise<void> {
  const kepala: KepalaTurunan = {
    idtrans  : transaksi.idjual,
    kodetrans: transaksi.kodejual,
    tgltrans : transaksi.tgltrans,
    idlokasi : transaksi.idlokasi,
  };

  await tulisJurnalGrandtotal(db, petakanJenisPenjualan(transaksi.jenistransaksi), kepala, grandtotal, namacustomer);
}

export type TransaksiPembelianTurunan = {
  idbeli  : number;
  kodebeli: string;
  tgltrans: Date;
  idlokasi: number;
};

export async function insertJurnalPembelian(
  db          : DatabasePerusahaanClient,
  transaksi   : TransaksiPembelianTurunan,
  namasupplier: string,
  grandtotal  : number,
): Promise<void> {
  const kepala: KepalaTurunan = {
    idtrans  : transaksi.idbeli,
    kodetrans: transaksi.kodebeli,
    tgltrans : transaksi.tgltrans,
    idlokasi : transaksi.idlokasi,
  };

  await tulisJurnalGrandtotal(db, "PEMBELIAN", kepala, grandtotal, namasupplier);
}

export function petakanJenisKas(jenis: JenisKas): "KAS MASUK" | "KAS KELUAR" {
  const mapped = jenis === "MASUK" ? "KAS MASUK" : "KAS KELUAR";

  return mapped;
}

export type TransaksiKasTurunan = {
  idkas   : number;
  kodekas : string;
  tgltrans: Date;
  idlokasi: number;
};

export async function insertJurnalKas(
  db      : DatabasePerusahaanClient,
  transaksi: TransaksiKasTurunan,
  jenis   : JenisKas,
  rincian : { keterangan: string; nominal: number }[],
): Promise<void> {
  const jenistransaksi = petakanJenisKas(jenis);
  const total = rincian.reduce((jumlah, item) => jumlah + item.nominal, 0);
  const saldoTotal: SaldoJurnal = jenis === "MASUK" ? "KREDIT" : "DEBET";
  const saldoRincian: SaldoJurnal = jenis === "MASUK" ? "DEBET" : "KREDIT";

  const baris: InsertJurnalBaris[] = [
    { saldo: saldoTotal, amount: total, catatan: jenistransaksi },
    ...rincian.map((item) => ({
      saldo  : saldoRincian,
      amount : item.nominal,
      catatan: buatCatatanJurnal({ jenistransaksi, keterangan: item.keterangan }),
    })),
  ];

  await insertJurnal(
    db,
    {
      jenistransaksi,
      idtrans       : transaksi.idkas,
      kodetrans     : transaksi.kodekas,
      tgltrans      : transaksi.tgltrans,
      idlokasi      : transaksi.idlokasi,
    },
    baris,
  );
}
