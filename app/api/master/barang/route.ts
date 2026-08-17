import { errorResponse, successResponse } from "@/lib/apiResponse";
import {
  createBarang,
  DuplicateKodeError,
  generateKodeBarang,
  listBarang,
} from "@/lib/server/barang/service";
import type { Barang } from "@/lib/server/barang/types";

export async function GET() {
  return successResponse({
    message: "Data barang berhasil diambil",
    data   : listBarang(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const autoGenerateKode = Boolean(body.autoGenerateKode);

    const barang: Barang = {
      kodebarang: autoGenerateKode ? generateKodeBarang() : String(body.kodebarang ?? ""),
      namabarang: String(body.namabarang ?? ""),
      kategori  : String(body.kategori ?? ""),
      satuan    : String(body.satuan ?? ""),
      hargabeli : Number(body.hargabeli),
      hargajual : Number(body.hargajual),
      stok      : Number(body.stok),
    };

    const created = createBarang(barang);

    return successResponse({
      statusCode: 201,
      message   : "Barang berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof DuplicateKodeError) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan barang",
    });
  }
}
