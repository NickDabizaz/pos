import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { createPembelian, listPembelian } from "@/lib/server/pembelian/service";
import type { CreatePembelianItemInput } from "@/lib/server/pembelian/types";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";
import type { PpnMode } from "@/lib/server/transaksi/types";

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

const ppnModes: PpnMode[] = ["TIDAK", "EXCLUDE", "INCLUDE"];

function parseItems(rawItems: unknown): CreatePembelianItemInput[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((item) => ({
    kodebarang: String(item.kodebarang ?? ""),
    qty       : Number(item.qty) || 0,
    harga     : Number(item.harga) || 0,
    pakaiPpn  : ppnModes.includes(item.pakaiPpn) ? (item.pakaiPpn as PpnMode) : "TIDAK",
    diskon    : Number(item.diskon) || 0,
  }));
}

export async function GET() {
  try {
    const db = await resolveDb();

    return successResponse({
      message: "Data pembelian berhasil diambil",
      data   : await listPembelian(db),
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data pembelian",
    });
  }
}

export async function POST(request: Request) {
  try {
    const db = await resolveDb();
    const body = await request.json();

    const created = await createPembelian(db, {
      tanggal     : String(body.tanggal ?? ""),
      kodesupplier: String(body.kodesupplier ?? ""),
      kodelokasi  : String(body.kodelokasi ?? ""),
      items       : parseItems(body.items),
    });

    return successResponse({
      statusCode: 201,
      message   : "Pembelian berhasil ditambahkan",
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
      message: error instanceof Error ? error.message : "Gagal menambahkan pembelian",
    });
  }
}
