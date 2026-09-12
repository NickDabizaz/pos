import { paramIdlokasi } from "@/lib/client/laporan/shared";

export type FilterOpnameStokState = {
  dari              : string;
  sampai            : string;
  termasukDibatalkan: boolean;
  tampilkanSemua    : boolean;
  idlokasi          : number[];
  totalLokasi       : number;
};

/** Menyusun URL `view` Laporan Opname Stok dari state filter. Parameter kosong tidak disertakan. */
export function buatUrlLaporanOpnameStok(filter: FilterOpnameStokState): string {
  const params = new URLSearchParams();
  if (filter.dari) params.set("dari", filter.dari);
  if (filter.sampai) params.set("sampai", filter.sampai);
  if (filter.termasukDibatalkan) params.set("termasukDibatalkan", "1");
  if (filter.tampilkanSemua) params.set("tampilkanSemua", "1");

  const lokasi = paramIdlokasi(filter.idlokasi, filter.totalLokasi);
  if (lokasi !== null) params.set("idlokasi", lokasi);

  const query = params.toString();

  return query ? `/laporan/opname-stok/view?${query}` : "/laporan/opname-stok/view";
}
