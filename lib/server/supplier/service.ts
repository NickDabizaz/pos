import {
  findAllSupplier,
  findSupplierByKode,
  insertSupplier,
  removeSupplier,
  replaceSupplier,
} from "@/lib/server/supplier/repository";
import type { Supplier } from "@/lib/server/supplier/types";

export class DuplicateKodeError extends Error {}
export class SupplierNotFoundError extends Error {}

export function listSupplier(): Supplier[] {
  return findAllSupplier();
}

export function generateKodeSupplier(): string {
  return `SUP-AUTO-${String(findAllSupplier().length + 1).padStart(4, "0")}`;
}

export function createSupplier(input: Supplier): Supplier {
  if (findSupplierByKode(input.kodesupplier)) {
    throw new DuplicateKodeError(`Kode supplier ${input.kodesupplier} sudah digunakan`);
  }

  insertSupplier(input);
  return input;
}

export function updateSupplier(kodesupplier: string, input: Supplier): Supplier {
  if (!findSupplierByKode(kodesupplier)) {
    throw new SupplierNotFoundError(`Supplier ${kodesupplier} tidak ditemukan`);
  }

  replaceSupplier(kodesupplier, input);
  return input;
}

export function deleteSupplier(kodesupplier: string): void {
  if (!findSupplierByKode(kodesupplier)) {
    throw new SupplierNotFoundError(`Supplier ${kodesupplier} tidak ditemukan`);
  }

  removeSupplier(kodesupplier);
}
