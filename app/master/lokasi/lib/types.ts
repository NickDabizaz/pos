import type { Lokasi } from "@/lib/server/lokasi/types";

export type { Lokasi };

export type LokasiFormErrors = {
  kodelokasi?: string;
  namalokasi?: string;
  keterangan?: string;
};
