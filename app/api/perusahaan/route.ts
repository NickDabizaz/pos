import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { EmailBelumTerverifikasiError, ensureEmailTerverifikasi, getCurrentSession } from "@/lib/server/auth/guard";
import { provisionDatabase } from "@/lib/server/provisioning/service";
import {
  daftarPerusahaan,
  KodePerusahaanBentrokError,
  KodePerusahaanOtomatisHabisError,
  NamaPerusahaanSudahDipakaiError,
  NamaPerusahaanTidakValidError,
  ProvisioningGagalError,
  SudahMemilikiPerusahaanError,
} from "@/lib/server/perusahaan/service";
import type { DaftarPerusahaanInput } from "@/lib/server/perusahaan/types";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
  }

  try {
    ensureEmailTerverifikasi(session);

    const body = await request.json();
    const generateKode = Boolean(body.generateKode);

    const input: DaftarPerusahaanInput = {
      iduser        : session.user.id,
      namaperusahaan: String(body.namaperusahaan ?? ""),
      generateKode,
      kodeperusahaan: generateKode ? "" : String(body.kodeperusahaan ?? ""),
    };

    const perusahaan = await daftarPerusahaan(prisma, input, { buatDatabase: provisionDatabase });

    return successResponse({
      statusCode: 201,
      message   : "Perusahaan berhasil didaftarkan",
      data      : perusahaan,
    });
  } catch (error) {
    if (error instanceof EmailBelumTerverifikasiError) {
      return errorResponse({ statusCode: 403, message: error.message });
    }
    if (error instanceof SudahMemilikiPerusahaanError || error instanceof NamaPerusahaanSudahDipakaiError || error instanceof KodePerusahaanBentrokError) {
      return errorResponse({ statusCode: 409, message: error.message });
    }
    if (error instanceof NamaPerusahaanTidakValidError) {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof KodePerusahaanOtomatisHabisError) {
      return errorResponse({ statusCode: 503, message: error.message });
    }
    if (error instanceof ProvisioningGagalError) {
      return errorResponse({ statusCode: 500, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mendaftarkan Perusahaan",
    });
  }
}
