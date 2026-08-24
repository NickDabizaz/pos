import { POS_KODELOKASI, resolveShiftRouteContext, todayIso } from "@/app/api/pos/shift/shared";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { cancelCloseShift } from "@/lib/server/shift/service";

export async function POST(request: Request) {
  try {
    const { db } = await resolveShiftRouteContext();
    const body = await request.json().catch(() => ({}));

    const shift = await cancelCloseShift(db, prisma, {
      tanggal   : todayIso(),
      kodelokasi: String(body.kodelokasi ?? POS_KODELOKASI),
    });

    return successResponse({
      message: "Penutupan shift berhasil dibatalkan",
      data   : shift,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && (error.cause === "SHIFT_BELUM_DIBUKA" || error.cause === "SHIFT_BELUM_TERTUTUP")) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membatalkan penutupan shift",
    });
  }
}
