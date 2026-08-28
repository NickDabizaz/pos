import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { createOpnameStok, listOpnameStok } from "@/lib/server/opnamestok/service";
import type { CreateOpnameStokItemInput } from "@/lib/server/opnamestok/types";
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

function parseItems(rawItems: unknown): CreateOpnameStokItemInput[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((item) => ({
    kodebarang: String(item.kodebarang ?? ""),
    jmlfisik  : Number(item.jmlfisik) || 0,
  }));
}

export async function GET() {
  try {
    const db = await resolveDb();

    return successResponse({
      message: "Data opname stok berhasil diambil",
      data   : await listOpnameStok(db),
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data opname stok",
    });
  }
}

export async function POST(request: Request) {
  try {
    const db = await resolveDb();
    const body = await request.json();

    const created = await createOpnameStok(db, {
      tanggal   : String(body.tanggal ?? ""),
      kodelokasi: String(body.kodelokasi ?? ""),
      items     : parseItems(body.items),
    });

    return successResponse({
      statusCode: 201,
      message   : "Opname stok berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan opname stok",
    });
  }
}
