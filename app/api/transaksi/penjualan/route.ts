import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { createPenjualan, listPenjualan } from "@/lib/server/penjualan/service";
import type { CreatePenjualanItemInput } from "@/lib/server/penjualan/types";
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

function parseItems(rawItems: unknown): CreatePenjualanItemInput[] {
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
      message: "Data penjualan berhasil diambil",
      data   : await listPenjualan(db),
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data penjualan",
    });
  }
}

export async function POST(request: Request) {
  try {
    const db = await resolveDb();
    const body = await request.json();

    const created = await createPenjualan(db, {
      tanggal       : String(body.tanggal ?? ""),
      jenistransaksi: body.jenistransaksi === "POS" ? "POS" : "PESANAN",
      kodecustomer  : String(body.kodecustomer ?? ""),
      kodelokasi    : String(body.kodelokasi ?? ""),
      items         : parseItems(body.items),
      pembayaran    : body.pembayaran
        ? { tunai: Number(body.pembayaran.tunai) || 0, nontunai: Number(body.pembayaran.nontunai) || 0 }
        : undefined,
    });

    return successResponse({
      statusCode: 201,
      message   : "Penjualan berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && (error.cause === "INPUT_TIDAK_SAH" || error.cause === "PEMBAYARAN_KURANG")) {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan penjualan",
    });
  }
}
