import type { Barang } from "@/lib/server/barang/types";

export type { Barang };

export type BarangFormErrors = Partial<Record<keyof Barang, string>>;
