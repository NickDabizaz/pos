import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { requireOwnerApiSession } from "@/lib/server/auth/guard";
import { findAnggotaPerusahaan } from "@/lib/server/keanggotaan/repository";
import { findKodemenuHakMenuAktif } from "@/lib/server/menu/repository";
import type { GlobalClient } from "@/lib/server/user/types";

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "PERUSAHAAN_TIDAK_AKTIF") return 403;
  if (error.cause === "BUKAN_OWNER") return 403;

  return null;
}

export async function handleGetAnggota(instance: AuthInstance, globalDb: GlobalClient, requestHeaders: Headers): Promise<Response> {
  try {
    const { idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);

    const anggota = await findAnggotaPerusahaan(globalDb, idperusahaan);
    const data = await Promise.all(
      anggota.map(async (row) => ({
        ...row,
        kodemenuAktif: row.isowner ? [] : await findKodemenuHakMenuAktif(globalDb, row.iduser, idperusahaan),
      })),
    );

    return successResponse({
      message: "Data anggota berhasil diambil",
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
      message: error instanceof Error ? error.message : "Gagal mengambil data anggota",
    });
  }
}

export async function GET(request: Request) {
  const response = await handleGetAnggota(auth, prisma, request.headers);

  return response;
}
