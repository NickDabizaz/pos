import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/auth/guard";
import {
  createSnapTransaction,
  PaketTidakDitemukanError,
  PerusahaanSudahAktifError,
  PerusahaanTidakDitemukanError,
} from "@/lib/server/subscription/service";
import { createMidtransClient } from "@/lib/server/subscription/midtransClient";
import { listMembershipsForUser } from "@/lib/server/user/service";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
  }

  try {
    const body = await request.json();
    const idperusahaan = Number(body.idperusahaan);
    const kodepaket = String(body.kodepaket ?? "");

    const memberships = await listMembershipsForUser(prisma, session.user.id);
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
    if (error instanceof PerusahaanTidakDitemukanError) {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof PerusahaanSudahAktifError) {
      return errorResponse({ statusCode: 409, message: error.message });
    }
    if (error instanceof PaketTidakDitemukanError) {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membuat transaksi Snap",
    });
  }
}
