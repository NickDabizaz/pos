import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findAllBarang } from "@/lib/server/barang/repository";
import { createBarang, generateKodeBarang } from "@/lib/server/barang/service";
import type { Barang } from "@/lib/server/barang/types";

export async function GET() {
  return successResponse({
    message: "Data barang berhasil diambil",
    data   : findAllBarang(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const autoGenerateKode = Boolean(body.autoGenerateKode);

    const barang: Barang = {
      kodebarang: autoGenerateKode ? generateKodeBarang() : String(body.kodebarang ?? ""),
      namabarang: String(body.namabarang ?? ""),
      barcode   : String(body.barcode ?? ""),
      satuan    : String(body.satuan ?? ""),
      hargabeli : Number(body.hargabeli),
      hargajual : Number(body.hargajual),
      pakaiStok : Boolean(body.pakaiStok),
      status    : Number(body.status) === 1 ? 1 : 0,
    };

    const created = createBarang(barang);

    return successResponse({
      statusCode: 201,
      message   : "Barang berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("sudah digunakan")) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan barang",
    });
  }
}
