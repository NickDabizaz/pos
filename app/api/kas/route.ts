import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findAllKas } from "@/lib/server/kas/repository";
import { createKas, generateKodeKas } from "@/lib/server/kas/service";
import type { Kas } from "@/lib/server/kas/types";

export async function GET() {
  return successResponse({
    message: "Data kas berhasil diambil",
    data   : findAllKas(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jenis: Kas["jenis"] = body.jenis === "KELUAR" ? "KELUAR" : "MASUK";

    const kas: Kas = {
      kodekas   : generateKodeKas(jenis),
      tanggal   : String(body.tanggal ?? ""),
      jenis,
      kodelokasi: String(body.kodelokasi ?? ""),
      namalokasi: String(body.namalokasi ?? ""),
      nominal   : Number(body.nominal) || 0,
      keterangan: String(body.keterangan ?? ""),
      status    : "S",
    };

    const created = createKas(kas);

    return successResponse({
      statusCode: 201,
      message   : "Kas berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "DUPLICATE") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan kas",
    });
  }
}
