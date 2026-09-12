import { paramIdlokasi } from "@/lib/client/laporan/shared";

export type FilterPosisiStokState = {
  idbarang    : number | null;
  tanggal     : string;
  tampilkanNol: boolean;
  idlokasi    : number[];
  totalLokasi : number;
};

/** Menyusun URL `view` Laporan Posisi Stok dari state filter. */
export function buatUrlLaporanPosisiStok(filter: FilterPosisiStokState): string {
  const params = new URLSearchParams();
  if (filter.idbarang) params.set("idbarang", String(filter.idbarang));
  if (filter.tanggal) params.set("tanggal", filter.tanggal);
  if (filter.tampilkanNol) params.set("tampilkanNol", "1");

  const lokasi = paramIdlokasi(filter.idlokasi, filter.totalLokasi);
  if (lokasi !== null) params.set("idlokasi", lokasi);

  const query = params.toString();

  return query ? `/laporan/posisi-stok/view?${query}` : "/laporan/posisi-stok/view";
}
