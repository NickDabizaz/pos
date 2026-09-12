import type { JenisKas } from "@/lib/server/kas/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanKas = {
  dari              ?: Date;
  sampai            ?: Date;
  termasukDibatalkan?: boolean;
  idlokasi          ?: number[];
};

export type DetailLaporanKas = {
  keterangan: string;
  nominal   : number;
};

/** Satu transaksi `kas` beserta detail-detailnya — laporan dikelompokkan per transaksi. */
export type TransaksiLaporanKas = {
  kodekas   : string;
  tgltrans  : Date;
  namalokasi: string;
  jenis     : JenisKas;
  grandtotal: number;
  status    : StatusTransaksi;
  detail    : DetailLaporanKas[];
};
