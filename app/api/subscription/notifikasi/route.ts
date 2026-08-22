import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import {
  handleMidtransNotification,
  JumlahTidakSesuaiError,
  OrderTidakDikenalError,
  PaketTidakDitemukanError,
  PerusahaanTidakDitemukanError,
  SignatureTidakValidError,
} from "@/lib/server/subscription/service";
import type { MidtransNotificationPayload } from "@/lib/server/subscription/types";

/** Menerima notifikasi status transaksi dari Midtrans. Tidak mensyaratkan sesi login —
 * keabsahannya diverifikasi lewat signature Midtrans, bukan cookie sesi. */
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
    if (error instanceof SignatureTidakValidError) {
      return errorResponse({ statusCode: 401, message: error.message });
    }
    if (error instanceof OrderTidakDikenalError) {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof PerusahaanTidakDitemukanError || error instanceof PaketTidakDitemukanError) {
      return errorResponse({ statusCode: 400, message: error.message });
    }
    if (error instanceof JumlahTidakSesuaiError) {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal memproses notifikasi Midtrans",
    });
  }
}
