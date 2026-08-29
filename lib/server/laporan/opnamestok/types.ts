import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanOpnameStok = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

/** Satu baris = satu `opnamestokdtl`, termasuk baris berselisih nol. */
export type BarisLaporanOpnameStok = {
  kodeopname: string;
  tgltrans  : Date;
  namalokasi: string;
  status    : StatusTransaksi;
  namabarang: string;
  satuan    : string;
  jmlsistem : number;
  jmlfisik  : number;
  selisih   : number;
};
