export type FilterJurnalState = {
  kodetrans: string;
  dari     : string;
  sampai   : string;
};

/** Menyusun URL `view` Laporan Jurnal Transaksi dari state filter. Parameter kosong tidak disertakan. */
export function buatUrlLaporanJurnal(filter: FilterJurnalState): string {
  const params = new URLSearchParams();
  if (filter.kodetrans) params.set("kodetrans", filter.kodetrans);
  if (filter.dari) params.set("dari", filter.dari);
  if (filter.sampai) params.set("sampai", filter.sampai);

  const query = params.toString();

  return query ? `/laporan/jurnal/view?${query}` : "/laporan/jurnal/view";
}
