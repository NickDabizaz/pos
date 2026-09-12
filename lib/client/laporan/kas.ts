import { paramIdlokasi } from "@/lib/client/laporan/shared";

export type FilterKasState = {
  dari              : string;
  sampai            : string;
  termasukDibatalkan: boolean;
  idlokasi          : number[];
  totalLokasi       : number;
};

/** Menyusun URL `view` Laporan Kas dari state filter. Parameter kosong tidak disertakan. */
export function buatUrlLaporanKas(filter: FilterKasState): string {
  const params = new URLSearchParams();
  if (filter.dari) params.set("dari", filter.dari);
  if (filter.sampai) params.set("sampai", filter.sampai);
  if (filter.termasukDibatalkan) params.set("termasukDibatalkan", "1");

  const lokasi = paramIdlokasi(filter.idlokasi, filter.totalLokasi);
  if (lokasi !== null) params.set("idlokasi", lokasi);

  const query = params.toString();

  return query ? `/laporan/kas/view?${query}` : "/laporan/kas/view";
}
