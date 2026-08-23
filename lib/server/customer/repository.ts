import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { Customer } from "@/lib/server/customer/types";

export async function findAllCustomer(db: DatabasePerusahaanClient): Promise<Customer[]> {
  const rows = await db.customer.findMany({ orderBy: { idcustomer: "asc" } });

  return rows;
}

export async function findCustomerByKode(db: DatabasePerusahaanClient, kodecustomer: string): Promise<Customer | null> {
  const row = await db.customer.findUnique({ where: { kodecustomer } });

  return row;
}

export async function insertCustomer(
  db          : DatabasePerusahaanClient,
  kodecustomer: string,
  namacustomer: string,
  telepon     : string | null,
  email       : string | null,
  alamat      : string | null,
): Promise<Customer> {
  const row = await db.customer.create({ data: { kodecustomer, namacustomer, telepon, email, alamat } });

  return row;
}

export async function updateCustomerByKode(
  db          : DatabasePerusahaanClient,
  kodecustomer: string,
  data        : { namacustomer?: string; telepon?: string | null; email?: string | null; alamat?: string | null; status?: number },
): Promise<Customer> {
  const row = await db.customer.update({ where: { kodecustomer }, data });

  return row;
}

export async function deleteCustomerByKode(db: DatabasePerusahaanClient, kodecustomer: string): Promise<void> {
  await db.customer.delete({ where: { kodecustomer } });
}
