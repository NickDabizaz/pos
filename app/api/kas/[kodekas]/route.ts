import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getKas, updateKas } from "@/lib/server/kas/service";
import type { Kas } from "@/lib/server/kas/types";

type RouteParams = { params: Promise<{ kodekas: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { kodekas } = await params;

  try {
    return successResponse({
      message: "Data kas berhasil diambil",
      data   : getKas(kodekas),
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "NOT_FOUND") {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil kas",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { kodekas } = await params;

  try {
    const body = await request.json();
    const existing = getKas(kodekas);

    const kas: Kas = {
      kodekas    : String(body.kodekas ?? kodekas),
      tanggal    : String(body.tanggal ?? ""),
      jenis      : existing.jenis,
      kodelokasi : String(body.kodelokasi ?? ""),
      namalokasi : String(body.namalokasi ?? ""),
      nominal    : Number(body.nominal) || 0,
      keterangan : String(body.keterangan ?? ""),
      status     : body.status === "D" ? "D" : "S",
      alasanBatal: body.alasanBatal ? String(body.alasanBatal) : undefined,
    };

    const updated = updateKas(kodekas, kas);

    return successResponse({
      message: "Kas berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "NOT_FOUND") {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah kas",
    });
  }
}
