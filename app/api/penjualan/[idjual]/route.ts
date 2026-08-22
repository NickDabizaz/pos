import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getPenjualan, updatePenjualan } from "@/lib/server/penjualan/service";
import type { Penjualan } from "@/lib/server/penjualan/types";
import { parseStatusTransaksi, parseTransaksiItems } from "@/lib/server/transaksi/parse";

type RouteParams = { params: Promise<{ idjual: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { idjual } = await params;

  try {
    return successResponse({
      message: "Data penjualan berhasil diambil",
      data   : getPenjualan(idjual),
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "NOT_FOUND") {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil penjualan",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { idjual } = await params;

  try {
    const body = await request.json();

    const penjualan: Penjualan = {
      kodejual      : String(body.kodejual ?? idjual),
      tanggal       : String(body.tanggal ?? ""),
      jenistransaksi: body.jenistransaksi === "POS" ? "POS" : "PESANAN",
      kodecustomer  : String(body.kodecustomer ?? ""),
      namacustomer  : String(body.namacustomer ?? ""),
      items         : parseTransaksiItems(body.items),
      total         : Number(body.total) || 0,
      diskon        : Number(body.diskon) || 0,
      ppn           : Number(body.ppn) || 0,
      grandtotal    : Number(body.grandtotal) || 0,
      status        : parseStatusTransaksi(body.status),
      alasanBatal   : body.alasanBatal ? String(body.alasanBatal) : undefined,
    };

    const updated = updatePenjualan(idjual, penjualan);

    return successResponse({
      message: "Penjualan berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "NOT_FOUND") {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah penjualan",
    });
  }
}
