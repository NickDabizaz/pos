import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findAllPembelian } from "@/lib/server/pembelian/repository";
import { createPembelian, generateKodePembelian } from "@/lib/server/pembelian/service";
import type { Pembelian } from "@/lib/server/pembelian/types";
import { parseTransaksiItems } from "@/lib/server/transaksi/parse";

export async function GET() {
  return successResponse({
    message: "Data pembelian berhasil diambil",
    data   : findAllPembelian(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pembelian: Pembelian = {
      kodebeli    : generateKodePembelian(),
      tanggal     : String(body.tanggal ?? ""),
      kodesupplier: String(body.kodesupplier ?? ""),
      namasupplier: String(body.namasupplier ?? ""),
      items       : parseTransaksiItems(body.items),
      total       : Number(body.total) || 0,
      diskon      : Number(body.diskon) || 0,
      ppn         : Number(body.ppn) || 0,
      grandtotal  : Number(body.grandtotal) || 0,
      status      : "S",
    };

    const created = createPembelian(pembelian);

    return successResponse({
      statusCode: 201,
      message   : "Pembelian berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "DUPLICATE") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan pembelian",
    });
  }
}
