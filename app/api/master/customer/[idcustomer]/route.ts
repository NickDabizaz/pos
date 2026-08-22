import { errorResponse, successResponse } from "@/lib/apiResponse";
import { deleteCustomer, updateCustomer } from "@/lib/server/customer/service";
import type { Customer } from "@/lib/server/customer/types";

type RouteParams = { params: Promise<{ idcustomer: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const { idcustomer } = await params;

  try {
    const body = await request.json();

    const customer: Customer = {
      kodecustomer: String(body.kodecustomer ?? idcustomer),
      namacustomer: String(body.namacustomer ?? ""),
      telepon     : String(body.telepon ?? ""),
      email       : String(body.email ?? ""),
      alamat      : String(body.alamat ?? ""),
      status      : Number(body.status) === 1 ? 1 : 0,
    };

    const updated = updateCustomer(idcustomer, customer);

    return successResponse({
      message: "Customer berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah customer",
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { idcustomer } = await params;

  try {
    deleteCustomer(idcustomer);

    return successResponse({ message: "Customer berhasil dihapus" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menghapus customer",
    });
  }
}
