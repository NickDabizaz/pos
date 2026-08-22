import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getShiftForToday, openShift } from "@/lib/server/shift/service";

export async function GET() {
  return successResponse({
    message: "Data shift hari ini berhasil diambil",
    data   : getShiftForToday(),
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
    if (error instanceof Error && error.cause === "SHIFT_CONFLICT") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membuka shift",
    });
  }
}
