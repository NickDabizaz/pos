import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { cancelPembelian, findPembelian } from "@/lib/server/pembelian/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

type RouteParams = { params: Promise<{ idbeli: string }> };

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { idbeli: kodebeli } = await params;

  try {
    const db = await resolveDb();
    const found = await findPembelian(db, kodebeli);

    if (!found) {
      return errorResponse({ statusCode: 404, message: `Pembelian dengan kode "${kodebeli}" tidak ditemukan` });
    }

    return successResponse({
      message: "Data pembelian berhasil diambil",
      data   : found,
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data pembelian",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { idbeli: kodebeli } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const cancelled = await cancelPembelian(db, kodebeli, body.alasanbatal ? String(body.alasanbatal) : undefined);

    return successResponse({
      message: "Pembelian berhasil dibatalkan",
      data   : cancelled,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "SUDAH_DIBATALKAN") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membatalkan pembelian",
    });
  }
}
