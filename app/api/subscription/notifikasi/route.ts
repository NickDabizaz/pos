import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { handleMidtransNotification } from "@/lib/server/subscription/service";
import type { MidtransNotificationPayload } from "@/lib/server/subscription/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MidtransNotificationPayload;

    const hasil = await handleMidtransNotification(prisma, payload);

    return successResponse({
      statusCode: 200,
      message   : "Notifikasi diproses",
      data      : hasil,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Signature notifikasi")) {
      return errorResponse({ statusCode: 401, message: error.message });
    }
    if (error instanceof Error && error.message.includes("tidak pernah dibuat")) {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (
      error instanceof Error &&
      (error.message.includes("Perusahaan dengan id") || error.message.includes("Paket Subscription"))
    ) {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof Error && error.message.includes("tidak sesuai harga")) {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal memproses notifikasi Midtrans",
    });
  }
}
