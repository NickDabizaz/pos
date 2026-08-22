import { successResponse } from "@/lib/apiResponse";
import { PAKET_SUBSCRIPTION } from "@/lib/server/subscription/service";

export async function GET() {
  const paket = PAKET_SUBSCRIPTION;

  return successResponse({
    statusCode: 200,
    message   : "Katalog Paket Subscription",
    data      : paket,
  });
}
