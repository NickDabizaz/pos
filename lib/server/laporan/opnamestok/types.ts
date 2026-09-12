import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanOpnameStok = {
  dari              ?: Date;
  sampai            ?: Date;
  termasukDibatalkan?: boolean;
  idlokasi          ?: number[];
  tampilkanSemua    ?: boolean;
};

export type DetailLaporanOpnameStok = {
  namabarang: string;
  satuan    : string;
  jmlsistem : number;
  jmlfisik  : number;
  selisih   : number;
};

/** Satu transaksi `opnamestok` beserta detail-detailnya — laporan dikelompokkan per transaksi. */
export type TransaksiLaporanOpnameStok = {
  kodeopname   : string;
  tgltrans     : Date;
  namalokasi   : string;
  status       : StatusTransaksi;
  detail       : DetailLaporanOpnameStok[];
  jmlDisembunyikan: number;
};
