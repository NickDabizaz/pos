import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { requireOwnerApiSession } from "@/lib/server/auth/guard";
import { findActiveMenuRows } from "@/lib/server/menu/repository";
import type { GlobalClient } from "@/lib/server/user/types";

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "PERUSAHAAN_TIDAK_AKTIF") return 403;
  if (error.cause === "BUKAN_OWNER") return 403;

  return null;
}

export async function handleGetDaftarMenu(instance: AuthInstance, globalDb: GlobalClient, requestHeaders: Headers): Promise<Response> {
  try {
    await requireOwnerApiSession(instance, globalDb, requestHeaders);

    const rows = await findActiveMenuRows(globalDb);
    const data = rows
      .filter((row) => row.jenis === "DETAIL")
      .map((row) => ({ kodemenu: row.kodemenu, namamenu: row.namamenu }));

    return successResponse({
      message: "Daftar menu berhasil diambil",
      data,
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil daftar menu",
    });
  }
}

export async function GET(request: Request) {
  const response = await handleGetDaftarMenu(auth, prisma, request.headers);

  return response;
}
