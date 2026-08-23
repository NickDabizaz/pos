import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { createLokasi, listLokasi } from "@/lib/server/lokasi/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

export async function GET() {
  try {
    const db = await resolveDb();

    return successResponse({
      message: "Data lokasi berhasil diambil",
      data   : await listLokasi(db),
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data lokasi",
    });
  }
}

export async function POST(request: Request) {
  try {
    const db = await resolveDb();
    const body = await request.json();

    const created = await createLokasi(db, {
      namalokasi: String(body.namalokasi ?? ""),
      keterangan: body.keterangan ? String(body.keterangan) : null,
    });

    return successResponse({
      statusCode: 201,
      message   : "Lokasi berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan lokasi",
    });
  }
}
