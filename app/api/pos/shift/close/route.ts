import { POS_KODELOKASI, resolveShiftRouteContext, todayIso } from "@/app/api/pos/shift/shared";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { closeShift } from "@/lib/server/shift/service";

export async function POST(request: Request) {
  try {
    const { db } = await resolveShiftRouteContext();
    const body = await request.json();

    const shift = await closeShift(db, prisma, {
      tanggal   : todayIso(),
      kodelokasi: String(body.kodelokasi ?? POS_KODELOKASI),
      kasaktual : Number(body.kasaktual),
      catatan   : body.catatan ? String(body.catatan) : undefined,
    });

    return successResponse({
      message: "Shift berhasil ditutup",
      data   : shift,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof Error && (error.cause === "SHIFT_BELUM_DIBUKA" || error.cause === "SHIFT_SUDAH_TERTUTUP")) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menutup shift",
    });
  }
}
