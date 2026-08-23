import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { createBarang, listBarang } from "@/lib/server/barang/service";
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
      message: "Data barang berhasil diambil",
      data   : await listBarang(db),
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data barang",
    });
  }
}

export async function POST(request: Request) {
  try {
    const db = await resolveDb();
    const body = await request.json();

    const created = await createBarang(db, {
      namabarang: String(body.namabarang ?? ""),
      barcode   : body.barcode ? String(body.barcode) : null,
      satuan    : String(body.satuan ?? ""),
      hargabeli : Number(body.hargabeli),
      hargajual : Number(body.hargajual),
      pakaistok : Boolean(body.pakaistok),
    });

    return successResponse({
      statusCode: 201,
      message   : "Barang berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan barang",
    });
  }
}
