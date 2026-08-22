export const menuRoutes: Record<string, string> = {
  B2H5G: "/master/barang",
  C6T8H: "/master/customer",
  S4L1I: "/master/supplier",
  VJK44: "/master/lokasi",
  Q4Z8X: "/pos",
  P8R4C: "/pembelian",
  J1N6D: "/penjualan",
  T5B8L: "/tutup-kasir",
  K9V4M: "/kas",
};

export function findKodemenuForPath(pathname: string): string | undefined {
  return Object.entries(menuRoutes).find(([, path]) => path === pathname)?.[0];
}
