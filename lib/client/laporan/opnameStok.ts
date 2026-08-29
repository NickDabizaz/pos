export type FilterOpnameStokState = {
  dari              : string;
  sampai            : string;
  termasukDibatalkan: boolean;
};

/** Menyusun URL `view` Laporan Opname Stok dari state filter. Parameter kosong tidak disertakan. */
export function buatUrlLaporanOpnameStok(filter: FilterOpnameStokState): string {
  const params = new URLSearchParams();
  if (filter.dari) params.set("dari", filter.dari);
  if (filter.sampai) params.set("sampai", filter.sampai);
  if (filter.termasukDibatalkan) params.set("termasukDibatalkan", "1");

  const query = params.toString();

  return query ? `/laporan/opname-stok/view?${query}` : "/laporan/opname-stok/view";
}
