import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { deleteSupplier, updateSupplier } from "@/lib/server/supplier/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

type RouteParams = { params: Promise<{ idsupplier: string }> };

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { idsupplier: kodesupplier } = await params;

  try {
    const db = await resolveDb();
    const body = await request.json();

    const updated = await updateSupplier(db, kodesupplier, {
      namasupplier: body.namasupplier !== undefined ? String(body.namasupplier) : undefined,
      kontakperson: body.kontakperson !== undefined ? (body.kontakperson ? String(body.kontakperson) : null) : undefined,
      telepon     : body.telepon !== undefined ? (body.telepon ? String(body.telepon) : null) : undefined,
      email       : body.email !== undefined ? (body.email ? String(body.email) : null) : undefined,
      alamat      : body.alamat !== undefined ? (body.alamat ? String(body.alamat) : null) : undefined,
      status      : body.status !== undefined ? (Number(body.status) as 0 | 1) : undefined,
    });

    return successResponse({
      message: "Supplier berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah supplier",
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { idsupplier: kodesupplier } = await params;

  try {
    const db = await resolveDb();

    await deleteSupplier(db, kodesupplier);

    return successResponse({ message: "Supplier berhasil dihapus" });
  } catch (error) {
    if (error instanceof Error && error.cause === "TIDAK_DITEMUKAN") {
      return errorResponse({ statusCode: 404, message: error.message });
    }
    if (error instanceof Error && error.cause === "MASIH_DIPAKAI") {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menghapus supplier",
    });
  }
}
