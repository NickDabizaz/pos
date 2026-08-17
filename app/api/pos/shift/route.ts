import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getActiveShift, openShift, ShiftAlreadyOpenError } from "@/lib/server/shift/service";

export async function GET() {
  return successResponse({
    message: "Data shift aktif berhasil diambil",
    data   : getActiveShift(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shift = openShift({
      kasirName: String(body.kasirName ?? ""),
      modalAwal: Number(body.modalAwal),
    });

    return successResponse({
      statusCode: 201,
      message   : "Shift berhasil dibuka",
      data      : shift,
    });
  } catch (error) {
    if (error instanceof ShiftAlreadyOpenError) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membuka shift",
    });
  }
}
