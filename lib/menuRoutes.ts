export const menuRoutes: Record<string, string> = {
  "MDATA-BRG": "/master/barang",
  "MDATA-CUS": "/master/customer",
  "MDATA-SUP": "/master/supplier",
  "MDATA-LOK": "/master/lokasi",
  "KASIR-POS": "/pos",
  "TRANS-BEL": "/transaksi/pembelian",
  "TRANS-JUL": "/transaksi/penjualan",
  "KASIR-TTP": "/tutup-kasir",
  "TRANS-KAS": "/transaksi/kas",
  "TRANS-OPS": "/transaksi/opname-stok",
  "LAP-JUL"  : "/laporan/penjualan",
  "LAP-BEL"  : "/laporan/pembelian",
  "LAP-KAS"  : "/laporan/kas",
  "LAP-OPS"  : "/laporan/opname-stok",
  "LAP-KST"  : "/laporan/kartu-stok",
  "LAP-PST"  : "/laporan/posisi-stok",
  "LAP-JRN"  : "/laporan/jurnal",
  LANGGANAN  : "/subscription",
  PENGGUNA   : "/manajemen-user",
  PENGATURAN : "/pengaturan",
};

export function findKodemenuForPath(pathname: string): string | undefined {
  return Object.entries(menuRoutes).find(([, path]) => path === pathname)?.[0];
}
