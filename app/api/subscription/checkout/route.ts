import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/auth/guard";
import { createSnapTransaction } from "@/lib/server/subscription/service";
import { createMidtransClient } from "@/lib/server/subscription/midtransClient";
import { findPerusahaanByUser } from "@/lib/server/user/repository";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
  }

  try {
    const body = await request.json();
    const idperusahaan = Number(body.idperusahaan);
    const kodepaket = String(body.kodepaket ?? "");

    const memberships = await findPerusahaanByUser(prisma, session.user.id);
    if (!memberships.some((membership) => membership.idperusahaan === idperusahaan)) {
      return errorResponse({ statusCode: 403, message: "Anda bukan anggota Perusahaan ini" });
    }

    const snap = await createSnapTransaction(prisma, idperusahaan, kodepaket, createMidtransClient());

    return successResponse({
      statusCode: 201,
      message   : "Transaksi Snap berhasil dibuat",
      data      : snap,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Perusahaan dengan id")) {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.message.includes("sudah aktif")) {
      return errorResponse({ statusCode: 409, message: error.message });
    }
    if (error instanceof Error && error.message.includes("Paket Subscription")) {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membuat transaksi Snap",
    });
  }
}
