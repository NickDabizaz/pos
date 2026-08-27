import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { requireOwnerApiSession } from "@/lib/server/auth/guard";
import { updateConfigModul } from "@/lib/server/config/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";
import type { GlobalClient } from "@/lib/server/user/types";

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "PERUSAHAAN_TIDAK_AKTIF" || error.cause === "BUKAN_OWNER") return 403;
  if (error.cause === "INPUT_TIDAK_SAH") return 400;

  return null;
}

export async function handleUpdatePengaturanModul(
  request       : Request,
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<Response> {
  try {
    const { idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);
    const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);
    const body = await request.json();

    const modul = String(body.modul ?? "");
    const items = Array.isArray(body.items)
      ? body.items.map((item: { config?: unknown; nilai?: unknown }) => ({
          config: String(item.config ?? ""),
          nilai : String(item.nilai ?? ""),
        }))
      : [];

    if (items.length === 0) {
      return errorResponse({ statusCode: 400, message: "Daftar Config yang ingin disimpan kosong" });
    }

    const updated = await updateConfigModul(db, modul, items);

    return successResponse({
      message: "Pengaturan berhasil disimpan",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menyimpan pengaturan",
    });
  }
}

export async function PUT(request: Request) {
  const response = await handleUpdatePengaturanModul(request, auth, prisma, request.headers);

  return response;
}
