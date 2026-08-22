import { errorResponse, successResponse } from "@/lib/apiResponse";
import { findAllCustomer } from "@/lib/server/customer/repository";
import { createCustomer, generateKodeCustomer } from "@/lib/server/customer/service";
import type { Customer } from "@/lib/server/customer/types";

export async function GET() {
  return successResponse({
    message: "Data customer berhasil diambil",
    data   : findAllCustomer(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const autoGenerateKode = Boolean(body.autoGenerateKode);

    const customer: Customer = {
      kodecustomer: autoGenerateKode ? generateKodeCustomer() : String(body.kodecustomer ?? ""),
      namacustomer: String(body.namacustomer ?? ""),
      telepon     : String(body.telepon ?? ""),
      email       : String(body.email ?? ""),
      alamat      : String(body.alamat ?? ""),
      status      : Number(body.status) === 1 ? 1 : 0,
    };

    const created = createCustomer(customer);

    return successResponse({
      statusCode: 201,
      message   : "Customer berhasil ditambahkan",
      data      : created,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("sudah digunakan")) {
      return errorResponse({ statusCode: 409, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menambahkan customer",
    });
  }
}
