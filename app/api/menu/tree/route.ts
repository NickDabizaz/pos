import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findActiveMenuRows } from "@/lib/server/menu/repository";
import { buildMenuTree } from "@/lib/server/menu/service";

export async function GET() {
  try {
    const rows = await findActiveMenuRows();
    const tree = buildMenuTree(rows);

    return successResponse({
      message: "Menu tree berhasil diambil",
      data   : tree,
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Terjadi Kesalahan Ketika Memuat Data Menu Tree",
    });
  }
}
