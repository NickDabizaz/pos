import { errorResponse, successResponse } from "@/lib/apiResponse";
import { NoActiveShiftError, recordShiftTransaction } from "@/lib/server/shift/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shift = recordShiftTransaction({
      paymentMethod: body.paymentMethod,
      grandTotal   : Number(body.grandTotal),
    });

    return successResponse({
      message: "Transaksi berhasil dicatat ke shift",
      data   : shift,
    });
  } catch (error) {
    if (error instanceof NoActiveShiftError) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mencatat transaksi shift",
    });
  }
}
