import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { requireOwnerApiSession } from "@/lib/server/auth/guard";
import { buatInvitation, findInvitationAktif } from "@/lib/server/invitation/service";
import type { GlobalClient } from "@/lib/server/invitation/types";

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "PERUSAHAAN_TIDAK_AKTIF") return 403;
  if (error.cause === "BUKAN_OWNER") return 403;

  return null;
}

export async function handleGetInvitation(instance: AuthInstance, globalDb: GlobalClient, requestHeaders: Headers): Promise<Response> {
  try {
    const { idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);

    const invitation = await findInvitationAktif(globalDb, idperusahaan);

    const response = successResponse({
      message: "Data invitation berhasil diambil",
      data   : invitation,
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data invitation",
    });
  }
}

export async function handlePostInvitation(instance: AuthInstance, globalDb: GlobalClient, requestHeaders: Headers): Promise<Response> {
  try {
    const { idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);

    const invitation = await buatInvitation(globalDb, idperusahaan);

    const response = successResponse({
      statusCode: 201,
      message   : "Link invitation berhasil dibuat",
      data      : invitation,
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal membuat link invitation",
    });
  }
}

export async function GET(request: Request) {
  const response = await handleGetInvitation(auth, prisma, request.headers);

  return response;
}

export async function POST(request: Request) {
  const response = await handlePostInvitation(auth, prisma, request.headers);

  return response;
}
