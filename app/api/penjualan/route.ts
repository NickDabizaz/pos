import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findAllPenjualan } from "@/lib/server/penjualan/repository";
import { createPenjualan, generateKodePenjualan } from "@/lib/server/penjualan/service";
import type { Penjualan } from "@/lib/server/penjualan/types";
import { parseTransaksiItems } from "@/lib/server/transaksi/parse";

export async function GET() {
  return successResponse({
    message: "Data penjualan berhasil diambil",
    data   : findAllPenjualan(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const penjualan: Penjualan = {
      kodejual      : generateKodePenjualan(),
      tanggal       : String(body.tanggal ?? ""),
      jenistransaksi: body.jenistransaksi === "POS" ? "POS" : "PESANAN",
      kodecustomer  : String(body.kodecustomer ?? ""),
      namacustomer  : String(body.namacustomer ?? ""),
      items         : parseTransaksiItems(body.items),
      total         : Number(body.total) || 0,
      diskon        : Number(body.diskon) || 0,
      ppn           : Number(body.ppn) || 0,
      grandtotal    : Number(body.grandtotal) || 0,
      status        : "S",
    };

    const created = createPenjualan(penjualan);

    return successResponse({
      statusCode: 201,
      message   : "Penjualan berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "DUPLICATE") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan penjualan",
    });
  }
}
