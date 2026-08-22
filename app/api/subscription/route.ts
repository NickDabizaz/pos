import { successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { listPaketLangganan } from "@/lib/server/subscription/service";

/** Menampilkan katalog Paket Langganan. */
export async function GET() {
  const paket = listPaketLangganan(prisma);

  return successResponse({
    statusCode: 200,
    message   : "Katalog Paket Langganan",
    data      : paket,
  });
}
