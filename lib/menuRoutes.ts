/**
 * Temporary code-side kodemenu -> route mapping, until the menu table gets
 * its own url column. Menu items without an entry here just highlight
 * (existing SideBar onSelectAction behavior) without navigating anywhere.
 */
export const menuRoutes: Record<string, string> = {
  B2H5G: "/master/barang", // Master > Barang
};

export function findKodemenuForPath(pathname: string): string | undefined {
  return Object.entries(menuRoutes).find(([, path]) => path === pathname)?.[0];
}
