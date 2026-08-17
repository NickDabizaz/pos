import { errorResponse, successResponse } from "@/lib/apiResponse";
import { cancelCloseShift, ShiftNotClosedTodayError } from "@/lib/server/shift/service";

export async function POST() {
  try {
    const shift = cancelCloseShift();

    return successResponse({
      message: "Penutupan shift berhasil dibatalkan",
      data   : shift,
    });
  } catch (error) {
    if (error instanceof ShiftNotClosedTodayError) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membatalkan penutupan shift",
    });
  }
}
