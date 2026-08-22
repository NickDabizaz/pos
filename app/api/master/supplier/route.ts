import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findAllSupplier } from "@/lib/server/supplier/repository";
import { createSupplier, generateKodeSupplier } from "@/lib/server/supplier/service";
import type { Supplier } from "@/lib/server/supplier/types";

export async function GET() {
  return successResponse({
    message: "Data supplier berhasil diambil",
    data   : findAllSupplier(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const autoGenerateKode = Boolean(body.autoGenerateKode);

    const supplier: Supplier = {
      kodesupplier: autoGenerateKode ? generateKodeSupplier() : String(body.kodesupplier ?? ""),
      namasupplier: String(body.namasupplier ?? ""),
      kontakPerson: String(body.kontakPerson ?? ""),
      telepon     : String(body.telepon ?? ""),
      email       : String(body.email ?? ""),
      alamat      : String(body.alamat ?? ""),
      status      : Number(body.status) === 1 ? 1 : 0,
    };

    const created = createSupplier(supplier);

    return successResponse({
      statusCode: 201,
      message   : "Supplier berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("sudah digunakan")) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan supplier",
    });
  }
}
