import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAksesMenu } from "@/lib/server/auth/guard";
import type { AuthInstance } from "@/lib/server/auth/service";
import { findActiveMenuRows } from "@/lib/server/menu/repository";
import { buildMenuTree, filterMenuUntukPengguna, kodemenuUntukRute } from "@/lib/server/menu/service";
import type { GlobalClient } from "@/lib/server/user/types";

export async function handleGetMenuTree(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<Response> {
  try {
    const { isOwner, kodemenuDiizinkan } = await requireAksesMenu(
      instance,
      globalDb,
      requestHeaders,
      kodemenuUntukRute("GET /api/menu/tree"),
    );

    const rows = await findActiveMenuRows(globalDb);
    const tree = filterMenuUntukPengguna(buildMenuTree(rows), { isOwner, kodemenuDiizinkan });

    return successResponse({
      message: "Menu tree berhasil diambil",
      data   : tree,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_LOGIN") {
      return errorResponse({ statusCode: 401, message: error.message });
    }
    if (
      error instanceof Error &&
      (error.cause === "PERUSAHAAN_TIDAK_AKTIF" || error.cause === "LANGGANAN_TIDAK_AKTIF" || error.cause === "TIDAK_PUNYA_HAK_MENU")
    ) {
      return errorResponse({ statusCode: 403, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Terjadi Kesalahan Ketika Memuat Data Menu Tree",
    });
  }
}

export async function GET(request: Request) {
  const response = await handleGetMenuTree(auth, prisma, request.headers);

  return response;
}
