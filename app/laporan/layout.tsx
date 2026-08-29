"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import SideBar from "@/components/SideBar";
import { findKodemenuForPath, menuRoutes } from "@/lib/menuRoutes";

export default function LaporanLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <SideBar
        activeKey      = {findKodemenuForPath(pathname)}
        apiUrl         = "/api/menu/tree"
        onSelectAction = {(node) => {
          const route = menuRoutes[node.kodemenu];

          if (route) {
            router.push(route);
          }
        }}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
