import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import type { MenuNode } from "./types";

export async function GET() {
  try {
    const rows = await prisma.menu.findMany({
      where: { status: 1 },
      orderBy: { urutan: "asc" },
    });

    const nodeMap = new Map<string, MenuNode>();
    for (const row of rows) {
      nodeMap.set(row.kodemenu, {
        kodemenu: row.kodemenu,
        namamenu: row.namamenu,
        jenis: row.jenis as MenuNode["jenis"],
        urutan: row.urutan,
        children: [],
      });
    }

    const tree: MenuNode[] = [];

    for (const row of rows) {
      const node = nodeMap.get(row.kodemenu)!;
      const parent = row.kodeinduk ? nodeMap.get(row.kodeinduk) : undefined;

      if (parent) {
        parent.children.push(node);
      } else {
        tree.push(node);
      }
    }

    return successResponse({
      message: "Menu tree berhasil diambil",
      data: tree,
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Terjadi Kesalahan Ketika Memuat Data Menu Tree",
    });
  }
}
