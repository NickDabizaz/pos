import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { createCustomer, listCustomer } from "@/lib/server/customer/service";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

async function resolveDb() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return db;
}

export async function GET() {
  try {
    const db = await resolveDb();

    return successResponse({
      message: "Data customer berhasil diambil",
      data   : await listCustomer(db),
    });
  } catch (error) {
    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengambil data customer",
    });
  }
}

export async function POST(request: Request) {
  try {
    const db = await resolveDb();
    const body = await request.json();

    const created = await createCustomer(db, {
      namacustomer: String(body.namacustomer ?? ""),
      telepon     : body.telepon ? String(body.telepon) : null,
      email       : body.email ? String(body.email) : null,
      alamat      : body.alamat ? String(body.alamat) : null,
    });

    return successResponse({
      statusCode: 201,
      message   : "Customer berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.cause === "INPUT_TIDAK_SAH") {
      return errorResponse({ statusCode: 400, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan customer",
    });
  }
}
