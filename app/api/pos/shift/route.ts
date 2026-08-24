import { POS_KODELOKASI, resolveShiftRouteContext, todayIso } from "@/app/api/pos/shift/shared";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getShiftStatus, openShift } from "@/lib/server/shift/service";

export async function GET(request: Request) {
  try {
    const { db } = await resolveShiftRouteContext();
    const kodelokasi = new URL(request.url).searchParams.get("kodelokasi") ?? POS_KODELOKASI;

    const status = await getShiftStatus(db, prisma, { tanggal: todayIso(), kodelokasi });

    return successResponse({
      message: "Status shift hari ini berhasil diambil",
      data   : status,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil status shift",
    });
  }
}

export async function POST(request: Request) {
  try {
    const { db, idkasir } = await resolveShiftRouteContext();
    const body = await request.json();

    const shift = await openShift(db, prisma, {
      tanggal   : todayIso(),
      kodelokasi: String(body.kodelokasi ?? POS_KODELOKASI),
      idkasir,
      modalawal : Number(body.modalawal),
    });

    return successResponse({
      statusCode: 201,
      message   : "Shift berhasil dibuka",
      data      : shift,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof Error && error.cause === "SHIFT_KONFLIK") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membuka shift",
    });
  }
}
