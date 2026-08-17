/**
 * Code-side kodemenu -> route mapping matching the database menu table.
 * Menu items without an entry here just highlight without navigating anywhere.
 */
export const menuRoutes: Record<string, string> = {
  B2H5G: "/master/barang",   // Master > Barang
  C6T8H: "/master/customer", // Master > Customer
  S4L1I: "/master/supplier", // Master > Supplier
  VJK44: "/master/lokasi",   // Master > Lokasi
  Q4Z8X: "/pos",             // Penjualan > Kasir POS
  T5B8L: "/tutup-kasir",     // Keuangan > Tutup Kasir
};

export function findKodemenuForPath(pathname: string): string | undefined {
  return Object.entries(menuRoutes).find(([, path]) => path === pathname)?.[0];
}
