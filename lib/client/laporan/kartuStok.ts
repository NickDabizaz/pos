export type FilterKartuStokState = {
  idbarang: number | null;
};

/** Menyusun URL `view` Laporan Kartu Stok dari state filter. `idbarang` kosong = semua Barang. */
export function buatUrlLaporanKartuStok(filter: FilterKartuStokState): string {
  if (!filter.idbarang) {
    return "/laporan/kartu-stok/view";
  }

  return `/laporan/kartu-stok/view?idbarang=${filter.idbarang}`;
}
