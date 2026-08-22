import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findAllLokasi } from "@/lib/server/lokasi/repository";
import { createLokasi, generateKodeLokasi } from "@/lib/server/lokasi/service";
import type { Lokasi } from "@/lib/server/lokasi/types";

export async function GET() {
  return successResponse({
    message: "Data lokasi berhasil diambil",
    data   : findAllLokasi(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const autoGenerateKode = Boolean(body.autoGenerateKode);

    const lokasi: Lokasi = {
      kodelokasi: autoGenerateKode ? generateKodeLokasi() : String(body.kodelokasi ?? ""),
      namalokasi: String(body.namalokasi ?? ""),
      keterangan: String(body.keterangan ?? ""),
      status    : Number(body.status) === 1 ? 1 : 0,
    };

    const created = createLokasi(lokasi);

    return successResponse({
      statusCode: 201,
      message   : "Lokasi berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("sudah digunakan")) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan lokasi",
    });
  }
}
