import { prisma } from "@/lib/prisma";
import type { MenuRow } from "@/lib/server/menu/types";

export async function findActiveMenuRows(): Promise<MenuRow[]> {
  const rows = await prisma.menu.findMany({
    where  : { status: 1 },
    orderBy: { urutan: "asc" },
  });

  return rows;
}
