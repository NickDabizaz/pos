import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { cancelKas, findKas, updateKas } from "@/lib/server/kas/service";
import type { CreateKasRincianInput, JenisKas } from "@/lib/server/kas/types";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

type RouteParams = { params: Promise<{ idkas: string }> };

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

function parseRincian(rawRincian: unknown): CreateKasRincianInput[] {
  if (!Array.isArray(rawRincian)) return [];

  return rawRincian.map((item) => ({
    keterangan: String(item.keterangan ?? ""),
    nominal   : Number(item.nominal) || 0,
  }));
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { idkas: kodekas } = await params;

  try {
    const db = await resolveDb();
    const found = await findKas(db, kodekas);

    if (!found) {
      return errorResponse({ statusCode: 404, message: `Kas dengan kode "${kodekas}" tidak ditemukan` });
    }

    return successResponse({
      message: "Data kas berhasil diambil",
      data   : found,
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data kas",
    });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { idkas: kodekas } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const updated = await updateKas(db, kodekas, {
      jenis  : (body.jenis ?? "") as JenisKas,
      rincian: parseRincian(body.rincian),
    });

    return successResponse({
      message: "Kas berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof Error && error.cause === "SUDAH_DIBATALKAN") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah kas",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { idkas: kodekas } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const cancelled = await cancelKas(db, kodekas, body.alasanbatal ? String(body.alasanbatal) : undefined);

    return successResponse({
      message: "Kas berhasil dibatalkan",
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
      message: error instanceof Error ? error.message : "Gagal membatalkan kas",
    });
  }
}
