import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { deleteLokasi, updateLokasi } from "@/lib/server/lokasi/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

type RouteParams = { params: Promise<{ idlokasi: string }> };

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { idlokasi: kodelokasi } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const updated = await updateLokasi(db, kodelokasi, {
      namalokasi: body.namalokasi !== undefined ? String(body.namalokasi) : undefined,
      keterangan: body.keterangan !== undefined ? String(body.keterangan) : undefined,
      status    : body.status !== undefined ? (Number(body.status) as 0 | 1) : undefined,
    });

    return successResponse({
      message: "Lokasi berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah lokasi",
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { idlokasi: kodelokasi } = await params;

  try {
    const db = await resolveDb();

    await deleteLokasi(db, kodelokasi);

    return successResponse({ message: "Lokasi berhasil dihapus" });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "MASIH_DIPAKAI") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menghapus lokasi",
    });
  }
}
