import { prisma } from "@/lib/prisma";
import type { MenuRow } from "@/lib/server/menu/types";

export async function findActiveMenuRows(): Promise<MenuRow[]> {
  return prisma.menu.findMany({
    where  : { status: 1 },
    orderBy: { urutan: "asc" },
  });
}
