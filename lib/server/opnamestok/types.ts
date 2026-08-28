import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type { StatusTransaksi };

export type OpnameStokItem = {
  kodebarang: string;
  namabarang: string;
  satuan    : string;
  jmlsistem : number;
  jmlfisik  : number;
  selisih   : number;
};

export type OpnameStok = {
  kodeopname : string;
  tanggal    : string;
  kodelokasi : string;
  namalokasi : string;
  items      : OpnameStokItem[];
  status     : StatusTransaksi;
  alasanbatal: string | null;
};

export type CreateOpnameStokItemInput = {
  kodebarang: string;
  jmlfisik  : number;
  /** Diterima dari client demi kelengkapan payload, tetapi selalu diabaikan server. */
  jmlsistem?: number;
};

export type CreateOpnameStokInput = {
  tanggal   : string;
  kodelokasi: string;
  items     : CreateOpnameStokItemInput[];
};

export type UpdateOpnameStokInput = {
  items: CreateOpnameStokItemInput[];
};
