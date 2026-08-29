export type FilterPosisiStokState = {
  idbarang    : number | null;
  tampilkanNol: boolean;
};

/** Menyusun URL `view` Laporan Posisi Stok dari state filter. */
export function buatUrlLaporanPosisiStok(filter: FilterPosisiStokState): string {
  const params = new URLSearchParams();
  if (filter.idbarang) params.set("idbarang", String(filter.idbarang));
  if (filter.tampilkanNol) params.set("tampilkanNol", "1");

  const query = params.toString();

  return query ? `/laporan/posisi-stok/view?${query}` : "/laporan/posisi-stok/view";
}
