import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthInstance } from "@/lib/server/auth/service";
import { findSession } from "@/lib/server/auth/service";
import { gabungViaInvitation } from "@/lib/server/invitation/service";
import type { GlobalClient } from "@/lib/server/invitation/types";

type RouteParams = { params: Promise<{ token: string }> };

function mapErrorStatus(error: Error): number | null {
  if (error.cause === "TIDAK_LOGIN") return 401;
  if (error.cause === "INVITATION_TIDAK_DITEMUKAN") return 404;
  if (error.cause === "INVITATION_KADALUARSA") return 410;

  return null;
}

export async function handlePostGabungInvitation(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
  token         : string,
): Promise<Response> {
  try {
    const session = await findSession(instance, requestHeaders);
    if (!session) {
      throw new Error("Anda harus login terlebih dahulu", { cause: "TIDAK_LOGIN" });
    }

    await gabungViaInvitation(globalDb, { token, iduser: session.user.id, idsesi: session.session.id });

    const response = successResponse({ message: "Berhasil bergabung ke Perusahaan" });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = mapErrorStatus(error);
      if (statusCode) {
        return errorResponse({ statusCode, message: error.message });
      }
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal bergabung ke Perusahaan",
    });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const response = await handlePostGabungInvitation(auth, prisma, request.headers, token);

  return response;
}
