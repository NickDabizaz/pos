import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { cancelOpnameStok, findOpnameStok, updateOpnameStok } from "@/lib/server/opnamestok/service";
import type { CreateOpnameStokItemInput } from "@/lib/server/opnamestok/types";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

type RouteParams = { params: Promise<{ kode: string }> };

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

function parseItems(rawItems: unknown): CreateOpnameStokItemInput[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((item) => ({
    kodebarang: String(item.kodebarang ?? ""),
    jmlfisik  : Number(item.jmlfisik) || 0,
  }));
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { kode } = await params;

  try {
    const db = await resolveDb();
    const found = await findOpnameStok(db, kode);

    if (!found) {
      return errorResponse({ statusCode: 404, message: `Opname Stok dengan kode "${kode}" tidak ditemukan` });
    }

    return successResponse({
      message: "Data opname stok berhasil diambil",
      data   : found,
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data opname stok",
    });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { kode } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const updated = await updateOpnameStok(db, kode, { items: parseItems(body.items) });

    return successResponse({
      message: "Opname stok berhasil diubah",
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
      message: error instanceof Error ? error.message : "Gagal mengubah opname stok",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { kode } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const cancelled = await cancelOpnameStok(db, kode, body.alasanbatal ? String(body.alasanbatal) : undefined);

    return successResponse({
      message: "Opname stok berhasil dibatalkan",
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
      message: error instanceof Error ? error.message : "Gagal membatalkan opname stok",
    });
  }
}
