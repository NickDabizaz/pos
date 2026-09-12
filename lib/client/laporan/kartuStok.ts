import { paramIdlokasi } from "@/lib/client/laporan/shared";

export type FilterKartuStokState = {
  idbarang   : number | null;
  dari       : string;
  sampai     : string;
  idlokasi   : number[];
  totalLokasi: number;
};

/** Menyusun URL `view` Laporan Kartu Stok dari state filter. `idbarang` kosong = semua Barang. */
export function buatUrlLaporanKartuStok(filter: FilterKartuStokState): string {
  const params = new URLSearchParams();
  if (filter.idbarang) params.set("idbarang", String(filter.idbarang));
  if (filter.dari) params.set("dari", filter.dari);
  if (filter.sampai) params.set("sampai", filter.sampai);

  const lokasi = paramIdlokasi(filter.idlokasi, filter.totalLokasi);
  if (lokasi !== null) params.set("idlokasi", lokasi);

  const query = params.toString();

  return query ? `/laporan/kartu-stok/view?${query}` : "/laporan/kartu-stok/view";
}
