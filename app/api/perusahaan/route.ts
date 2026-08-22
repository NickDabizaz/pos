import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { cekEmailTerverifikasi, getCurrentSession } from "@/lib/server/auth/guard";
import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import { daftarPerusahaan } from "@/lib/server/perusahaan/service";
import type { DaftarPerusahaanInput } from "@/lib/server/perusahaan/types";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
  }

  try {
    cekEmailTerverifikasi(session);

    const body = await request.json();
    const generateKode = Boolean(body.generateKode);

    const input: DaftarPerusahaanInput = {
      iduser        : session.user.id,
      namaperusahaan: String(body.namaperusahaan ?? ""),
      generateKode,
      kodeperusahaan: generateKode ? "" : String(body.kodeperusahaan ?? ""),
    };

    const perusahaan = await daftarPerusahaan(prisma, input, { buatDatabase: createDatabasePerusahaan });

    return successResponse({
      statusCode: 201,
      message   : "Perusahaan berhasil didaftarkan",
      data      : perusahaan,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "EMAIL_BELUM_TERVERIFIKASI") {
      return errorResponse({ statusCode: 403, message: error.message });
    }
    if (
      error instanceof Error &&
      (error.cause === "SUDAH_MEMILIKI_PERUSAHAAN" || error.cause === "NAMA_SUDAH_DIPAKAI" || error.cause === "KODE_BENTROK")
    ) {
      return errorResponse({ statusCode: 409, message: error.message });
    }
    if (error instanceof Error && error.cause === "NAMA_TIDAK_VALID") {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof Error && error.cause === "KODE_OTOMATIS_HABIS") {
      return errorResponse({ statusCode: 503, message: error.message });
    }
    if (error instanceof Error && error.cause === "GAGAL_SIAPKAN_DATABASE") {
      return errorResponse({ statusCode: 500, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mendaftarkan Perusahaan",
    });
  }
}
