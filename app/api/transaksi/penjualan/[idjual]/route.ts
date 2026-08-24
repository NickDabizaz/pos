import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { cancelPenjualan, findPenjualan, updatePenjualan } from "@/lib/server/penjualan/service";
import type { CreatePenjualanItemInput } from "@/lib/server/penjualan/types";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";
import type { PpnMode } from "@/lib/server/transaksi/types";

const ppnModes: PpnMode[] = ["TIDAK", "EXCLUDE", "INCLUDE"];

type RouteParams = { params: Promise<{ idjual: string }> };

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

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

export async function GET(_request: Request, { params }: RouteParams) {
  const { idjual: kodejual } = await params;

  try {
    const db = await resolveDb();
    const found = await findPenjualan(db, kodejual);

    if (!found) {
      return errorResponse({ statusCode: 404, message: `Penjualan dengan kode "${kodejual}" tidak ditemukan` });
    }

    return successResponse({
      message: "Data penjualan berhasil diambil",
      data   : found,
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data penjualan",
    });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { idjual: kodejual } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const updated = await updatePenjualan(db, kodejual, {
      kodecustomer: String(body.kodecustomer ?? ""),
      items       : parseItems(body.items),
      pembayaran  : body.pembayaran
        ? { tunai: Number(body.pembayaran.tunai) || 0, nontunai: Number(body.pembayaran.nontunai) || 0 }
        : undefined,
    });

    return successResponse({
      message: "Penjualan berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && (error.cause === "INPUT_TIDAK_SAH" || error.cause === "PEMBAYARAN_KURANG")) {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof Error && error.cause === "SUDAH_DIBATALKAN") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah penjualan",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { idjual: kodejual } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const cancelled = await cancelPenjualan(db, kodejual, body.alasanbatal ? String(body.alasanbatal) : undefined);

    return successResponse({
      message: "Penjualan berhasil dibatalkan",
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
      message: error instanceof Error ? error.message : "Gagal membatalkan penjualan",
    });
  }
}
