import { errorResponse, successResponse } from "@/lib/apiResponse";
import { deleteLokasi, updateLokasi } from "@/lib/server/lokasi/service";
import type { Lokasi } from "@/lib/server/lokasi/types";

type RouteParams = { params: Promise<{ idlokasi: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const { idlokasi } = await params;

  try {
    const body = await request.json();

    const lokasi: Lokasi = {
      kodelokasi: String(body.kodelokasi ?? idlokasi),
      namalokasi: String(body.namalokasi ?? ""),
      keterangan: String(body.keterangan ?? ""),
      status    : Number(body.status) === 1 ? 1 : 0,
    };

    const updated = updateLokasi(idlokasi, lokasi);

    return successResponse({
      message: "Lokasi berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah lokasi",
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { idlokasi } = await params;

  try {
    deleteLokasi(idlokasi);

    return successResponse({ message: "Lokasi berhasil dihapus" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menghapus lokasi",
    });
  }
}
