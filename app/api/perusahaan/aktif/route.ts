import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/auth/guard";
import { pilihPerusahaan } from "@/lib/server/perusahaan/service";
import { findPerusahaanByUser } from "@/lib/server/user/repository";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
  }

  const memberships = await findPerusahaanByUser(prisma, session.user.id);

  return successResponse({ message: "Daftar Perusahaan berhasil diambil", data: memberships });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return errorResponse({ statusCode: 401, message: "Anda harus login terlebih dahulu" });
  }

  try {
    const body = await request.json();
    const idperusahaan = Number(body.idperusahaan);

    await pilihPerusahaan(prisma, {
      iduser: session.user.id,
      idsesi: session.session.id,
      idperusahaan,
    });

    return successResponse({ message: "Perusahaan Aktif berhasil diperbarui" });
  } catch (error) {
    if (error instanceof Error && error.cause === "BUKAN_ANGGOTA") {
      return errorResponse({ statusCode: 403, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal memilih Perusahaan",
    });
  }
}
