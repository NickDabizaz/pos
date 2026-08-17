import { errorResponse, successResponse } from "@/lib/apiResponse";
import { BarangNotFoundError, deleteBarang, updateBarang } from "@/lib/server/barang/service";
import type { Barang } from "@/lib/server/barang/types";

type RouteParams = { params: Promise<{ idbarang: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const { idbarang } = await params;

  try {
    const body = await request.json();

    const barang: Barang = {
      kodebarang: String(body.kodebarang ?? idbarang),
      namabarang: String(body.namabarang ?? ""),
      kategori  : String(body.kategori ?? ""),
      satuan    : String(body.satuan ?? ""),
      hargabeli : Number(body.hargabeli),
      hargajual : Number(body.hargajual),
      stok      : Number(body.stok),
    };

    const updated = updateBarang(idbarang, barang);

    return successResponse({
      message: "Barang berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof BarangNotFoundError) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah barang",
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { idbarang } = await params;

  try {
    deleteBarang(idbarang);

    return successResponse({ message: "Barang berhasil dihapus" });
  } catch (error) {
    if (error instanceof BarangNotFoundError) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menghapus barang",
    });
  }
}
