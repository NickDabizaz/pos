import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/auth/guard";
import { syncSnapTransaction } from "@/lib/server/subscription/service";
import { createMidtransClient } from "@/lib/server/subscription/midtransClient";
import { findPerusahaanByUser } from "@/lib/server/user/repository";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
  }

  try {
    const body = await request.json();
    const orderid = String(body.orderid ?? "");

    const idperusahaanDariOrderid = Number(orderid.split("-")[1]);
    const memberships = await findPerusahaanByUser(prisma, session.user.id);
    if (!memberships.some((membership) => membership.idperusahaan === idperusahaanDariOrderid)) {
      return errorResponse({ statusCode: 403, message: "Anda bukan anggota Perusahaan ini" });
    }

    const hasil = await syncSnapTransaction(prisma, orderid, createMidtransClient());

    return successResponse({
      statusCode: 200,
      message   : "Status transaksi disinkronkan",
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
      (error.message.includes("Perusahaan dengan id") ||
        error.message.includes("Paket Subscription") ||
        error.message.includes("tidak sesuai harga"))
    ) {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menyinkronkan status transaksi",
    });
  }
}
