import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { requireOwnerApiSession } from "@/lib/server/auth/guard";
import { cabutStatusOwner } from "@/lib/server/keanggotaan/service";
import type { GlobalClient } from "@/lib/server/user/types";

type RouteParams = { params: Promise<{ iduser: string }> };

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "PERUSAHAAN_TIDAK_AKTIF") return 403;
  if (error.cause === "BUKAN_OWNER") return 403;
  if (error.cause === "BUKAN_ANGGOTA") return 404;
  if (error.cause === "TARGET_BUKAN_OWNER") return 400;
  if (error.cause === "SATU_SATUNYA_OWNER") return 409;

  return null;
}

export async function handleDeleteStatusOwner(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
  idusertarget  : string,
): Promise<Response> {
  try {
    const { session, idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);

    await cabutStatusOwner(globalDb, {
      idpemanggil: session.user.id,
      idusertarget,
      idperusahaan,
    });

    return successResponse({ message: "Status Owner berhasil dicabut" });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mencabut status Owner",
    });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { iduser } = await params;
  const response = await handleDeleteStatusOwner(auth, prisma, request.headers, iduser);

  return response;
}
