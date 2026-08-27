import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { requireOwnerApiSession } from "@/lib/server/auth/guard";
import { listConfig, updateConfig } from "@/lib/server/config/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";
import type { GlobalClient } from "@/lib/server/user/types";

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "PERUSAHAAN_TIDAK_AKTIF" || error.cause === "BUKAN_OWNER") return 403;

  return null;
}

export async function handleGetPengaturan(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<Response> {
  try {
    const { idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);
    const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

    return successResponse({
      message: "Data pengaturan berhasil diambil",
      data   : await listConfig(db),
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data pengaturan",
    });
  }
}

export async function handleUpdatePengaturan(
  request       : Request,
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<Response> {
  try {
    const { idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);
    const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);
    const body = await request.json();

    const updated = await updateConfig(db, {
      modul : String(body.modul ?? ""),
      config: String(body.config ?? ""),
      nilai : String(body.nilai ?? ""),
    });

    return successResponse({
      message: "Pengaturan berhasil disimpan",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }
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

export async function GET(request: Request) {
  const response = await handleGetPengaturan(auth, prisma, request.headers);

  return response;
}

export async function PUT(request: Request) {
  const response = await handleUpdatePengaturan(request, auth, prisma, request.headers);

  return response;
}
