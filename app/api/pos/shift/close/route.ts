import { errorResponse, successResponse } from "@/lib/apiResponse";
import { closeShift } from "@/lib/server/shift/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shift = closeShift({
      kasAktual: Number(body.kasAktual),
      catatan  : body.catatan ? String(body.catatan) : undefined,
    });

    return successResponse({
      message: "Shift berhasil ditutup",
      data   : shift,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "SHIFT_CONFLICT") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menutup shift",
    });
  }
}
