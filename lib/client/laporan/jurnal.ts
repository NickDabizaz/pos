import { paramIdlokasi } from "@/lib/client/laporan/shared";

export type FilterJurnalState = {
  kodetrans  : string;
  dari       : string;
  sampai     : string;
  idlokasi   : number[];
  totalLokasi: number;
};

/** Menyusun URL `view` Laporan Jurnal Transaksi dari state filter. Parameter kosong tidak disertakan. */
export function buatUrlLaporanJurnal(filter: FilterJurnalState): string {
  const params = new URLSearchParams();
  if (filter.kodetrans) params.set("kodetrans", filter.kodetrans);
  if (filter.dari) params.set("dari", filter.dari);
  if (filter.sampai) params.set("sampai", filter.sampai);

  const lokasi = paramIdlokasi(filter.idlokasi, filter.totalLokasi);
  if (lokasi !== null) params.set("idlokasi", lokasi);

  const query = params.toString();

  return query ? `/laporan/jurnal/view?${query}` : "/laporan/jurnal/view";
}
