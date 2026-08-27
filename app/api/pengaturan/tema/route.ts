import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/auth/guard";
import { bacaTema } from "@/lib/server/config/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

export async function GET() {
  try {
    const session = await getCurrentSession();
    const idperusahaan = session?.session.idperusahaan;
    if (!session || !idperusahaan) {
      return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
    }

    const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

    return successResponse({
      message: "Tema berhasil diambil",
      data   : { tema: await bacaTema(db) },
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil tema tampilan",
    });
  }
}
