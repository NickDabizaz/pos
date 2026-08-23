import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { deleteBarang, updateBarang } from "@/lib/server/barang/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

type RouteParams = { params: Promise<{ idbarang: string }> };

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
  const { idbarang: kodebarang } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const updated = await updateBarang(db, kodebarang, {
      namabarang: body.namabarang !== undefined ? String(body.namabarang) : undefined,
      barcode   : body.barcode !== undefined ? (body.barcode ? String(body.barcode) : null) : undefined,
      satuan    : body.satuan !== undefined ? String(body.satuan) : undefined,
      hargabeli : body.hargabeli !== undefined ? Number(body.hargabeli) : undefined,
      hargajual : body.hargajual !== undefined ? Number(body.hargajual) : undefined,
      pakaistok : body.pakaistok !== undefined ? Boolean(body.pakaistok) : undefined,
      status    : body.status !== undefined ? (Number(body.status) as 0 | 1) : undefined,
    });

    return successResponse({
      message: "Barang berhasil diubah",
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
      message: error instanceof Error ? error.message : "Gagal mengubah barang",
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { idbarang: kodebarang } = await params;

  try {
    const db = await resolveDb();

    await deleteBarang(db, kodebarang);

    return successResponse({ message: "Barang berhasil dihapus" });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "MASIH_DIPAKAI") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menghapus barang",
    });
  }
}
