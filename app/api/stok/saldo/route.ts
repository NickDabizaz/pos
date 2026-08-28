import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { bacaSaldoStok } from "@/lib/server/kartustok/service";
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

export async function GET(request: Request) {
  try {
    const db = await resolveDb();
    const url = new URL(request.url);
    const kodelokasi = url.searchParams.get("kodelokasi") ?? "";
    const tanggalParam = url.searchParams.get("tanggal");
    const tanggal = tanggalParam ? new Date(tanggalParam) : new Date();

    const data = await bacaSaldoStok(db, kodelokasi, tanggal);

    return successResponse({
      message: "Saldo stok berhasil diambil",
      data,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil saldo stok",
    });
  }
}
