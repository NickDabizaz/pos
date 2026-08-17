import { errorResponse, successResponse } from "@/lib/apiResponse";
import { deleteSupplier, SupplierNotFoundError, updateSupplier } from "@/lib/server/supplier/service";
import type { Supplier } from "@/lib/server/supplier/types";

type RouteParams = { params: Promise<{ idsupplier: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const { idsupplier } = await params;

  try {
    const body = await request.json();

    const supplier: Supplier = {
      kodesupplier: String(body.kodesupplier ?? idsupplier),
      namasupplier: String(body.namasupplier ?? ""),
      kontakPerson: String(body.kontakPerson ?? ""),
      telepon     : String(body.telepon ?? ""),
      email       : String(body.email ?? ""),
      alamat      : String(body.alamat ?? ""),
      status      : Number(body.status) === 1 ? 1 : 0,
    };

    const updated = updateSupplier(idsupplier, supplier);

    return successResponse({
      message: "Supplier berhasil diubah",
      data   : updated,
    });
  } catch (error) {
    if (error instanceof SupplierNotFoundError) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal mengubah supplier",
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { idsupplier } = await params;

  try {
    deleteSupplier(idsupplier);

    return successResponse({ message: "Supplier berhasil dihapus" });
  } catch (error) {
    if (error instanceof SupplierNotFoundError) {
      return errorResponse({ statusCode: 404, message: error.message });
    }

    return errorResponse({
      message: error instanceof Error ? error.message : "Gagal menghapus supplier",
    });
  }
}
