import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getPembelian, updatePembelian } from "@/lib/server/pembelian/service";
import type { Pembelian } from "@/lib/server/pembelian/types";
import { parseStatusTransaksi, parseTransaksiItems } from "@/lib/server/transaksi/parse";

type RouteParams = { params: Promise<{ idbeli: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { idbeli } = await params;

  try {
    return successResponse({
      message: "Data pembelian berhasil diambil",
      data   : getPembelian(idbeli),
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "NOT_FOUND") {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil pembelian",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { idbeli } = await params;

  try {
    const body = await request.json();

    const pembelian: Pembelian = {
      kodebeli    : String(body.kodebeli ?? idbeli),
      tanggal     : String(body.tanggal ?? ""),
      kodesupplier: String(body.kodesupplier ?? ""),
      namasupplier: String(body.namasupplier ?? ""),
      items       : parseTransaksiItems(body.items),
      total       : Number(body.total) || 0,
      diskon      : Number(body.diskon) || 0,
      ppn         : Number(body.ppn) || 0,
      grandtotal  : Number(body.grandtotal) || 0,
      status      : parseStatusTransaksi(body.status),
      alasanBatal : body.alasanBatal ? String(body.alasanBatal) : undefined,
    };

    const updated = updatePembelian(idbeli, pembelian);

    return successResponse({
      message: "Pembelian berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "NOT_FOUND") {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah pembelian",
    });
  }
}
