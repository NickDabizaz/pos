import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { requireOwnerApiSession } from "@/lib/server/auth/guard";
import { matikanHakMenu, nyalakanHakMenu } from "@/lib/server/menu/service";
import type { GlobalClient } from "@/lib/server/user/types";

type RouteParams = { params: Promise<{ iduser: string; kodemenu: string }> };

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "PERUSAHAAN_TIDAK_AKTIF") return 403;
  if (error.cause === "BUKAN_OWNER") return 403;
  if (error.cause === "BUKAN_ANGGOTA") return 404;
  if (error.cause === "MENU_TIDAK_DITEMUKAN") return 404;
  if (error.cause === "TARGET_OWNER") return 400;
  if (error.cause === "BUKAN_MENU_DETAIL") return 400;

  return null;
}

export async function handlePutHakMenu(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
  idusertarget  : string,
  kodemenu      : string,
): Promise<Response> {
  try {
    const { session, idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);

    await nyalakanHakMenu(globalDb, { idpemanggil: session.user.id, idusertarget, idperusahaan, kodemenu });

    const response = successResponse({ message: "Hak Menu berhasil dinyalakan" });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengatur Hak Menu",
    });
  }
}

export async function handleDeleteHakMenu(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
  idusertarget  : string,
  kodemenu      : string,
): Promise<Response> {
  try {
    const { session, idperusahaan } = await requireOwnerApiSession(instance, globalDb, requestHeaders);

    await matikanHakMenu(globalDb, { idpemanggil: session.user.id, idusertarget, idperusahaan, kodemenu });

    const response = successResponse({ message: "Hak Menu berhasil dimatikan" });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengatur Hak Menu",
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { iduser, kodemenu } = await params;
  const response = await handlePutHakMenu(auth, prisma, request.headers, iduser, kodemenu);

  return response;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { iduser, kodemenu } = await params;
  const response = await handleDeleteHakMenu(auth, prisma, request.headers, iduser, kodemenu);

  return response;
}
