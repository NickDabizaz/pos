import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { Supplier } from "@/lib/server/supplier/types";

export async function findAllSupplier(db: DatabasePerusahaanClient): Promise<Supplier[]> {
  const rows = await db.supplier.findMany({ orderBy: { idsupplier: "asc" } });

  return rows;
}

export async function findSupplierByKode(db: DatabasePerusahaanClient, kodesupplier: string): Promise<Supplier | null> {
  const row = await db.supplier.findUnique({ where: { kodesupplier } });

  return row;
}

export async function insertSupplier(
  db          : DatabasePerusahaanClient,
  kodesupplier: string,
  namasupplier: string,
  kontakperson: string | null,
  telepon     : string | null,
  email       : string | null,
  alamat      : string | null,
): Promise<Supplier> {
  const row = await db.supplier.create({ data: { kodesupplier, namasupplier, kontakperson, telepon, email, alamat } });

  return row;
}

export async function updateSupplierByKode(
  db          : DatabasePerusahaanClient,
  kodesupplier: string,
  data        : { namasupplier?: string; kontakperson?: string | null; telepon?: string | null; email?: string | null; alamat?: string | null; status?: number },
): Promise<Supplier> {
  const row = await db.supplier.update({ where: { kodesupplier }, data });

  return row;
}

export async function deleteSupplierByKode(db: DatabasePerusahaanClient, kodesupplier: string): Promise<void> {
  await db.supplier.delete({ where: { kodesupplier } });
}
