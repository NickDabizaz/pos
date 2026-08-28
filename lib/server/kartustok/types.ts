export const JENIS_TRANSAKSI = ["PENJUALAN", "POS", "PEMBELIAN", "KAS MASUK", "KAS KELUAR", "OPNAME STOK"] as const;

export type JenisTransaksi = (typeof JENIS_TRANSAKSI)[number];

export type JenisTransaksiStok = Extract<JenisTransaksi, "PENJUALAN" | "POS" | "PEMBELIAN">;

export type MasukKeluar = "M" | "K";
