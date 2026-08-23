import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import {
  deleteCustomerByKode,
  findAllCustomer,
  findCustomerByKode,
  insertCustomer,
  updateCustomerByKode,
} from "@/lib/server/customer/repository";
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/lib/server/customer/types";

function isRecordNotFound(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

  return cocok;
}

function isForeignKeyConstraint(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";

  return cocok;
}

function pesanTidakDitemukan(kodecustomer: string): string {
  return `Customer dengan kode "${kodecustomer}" tidak ditemukan`;
}

export async function listCustomer(db: DatabasePerusahaanClient): Promise<Customer[]> {
  const rows = await findAllCustomer(db);

  return rows;
}

export async function findCustomer(db: DatabasePerusahaanClient, kodecustomer: string): Promise<Customer | null> {
  const row = await findCustomerByKode(db, kodecustomer);

  return row;
}

export async function createCustomer(db: DatabasePerusahaanClient, input: CreateCustomerInput): Promise<Customer> {
  const namacustomer = input.namacustomer.trim();
  if (!namacustomer) {
    throw new Error("Nama Customer tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
  }

  const telepon = input.telepon?.trim() || null;
  const email = input.email?.trim() || null;
  const alamat = input.alamat?.trim() || null;

  const customer = await simpanDenganKode(db, "customer", new Date(), (kode) =>
    insertCustomer(db, kode, namacustomer, telepon, email, alamat),
  );

  return customer;
}

export async function updateCustomer(
  db          : DatabasePerusahaanClient,
  kodecustomer: string,
  input       : UpdateCustomerInput,
): Promise<Customer> {
  const data: { namacustomer?: string; telepon?: string | null; email?: string | null; alamat?: string | null; status?: number } = {};

  if (input.namacustomer !== undefined) {
    const namacustomer = input.namacustomer.trim();
    if (!namacustomer) {
      throw new Error("Nama Customer tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
    }
    data.namacustomer = namacustomer;
  }

  if (input.telepon !== undefined) {
    data.telepon = input.telepon?.trim() || null;
  }

  if (input.email !== undefined) {
    data.email = input.email?.trim() || null;
  }

  if (input.alamat !== undefined) {
    data.alamat = input.alamat?.trim() || null;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  try {
    const row = await updateCustomerByKode(db, kodecustomer, data);

    return row;
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodecustomer), { cause: "TIDAK_DITEMUKAN" });
    }
    throw error;
  }
}

export async function deleteCustomer(db: DatabasePerusahaanClient, kodecustomer: string): Promise<void> {
  try {
    await deleteCustomerByKode(db, kodecustomer);
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodecustomer), { cause: "TIDAK_DITEMUKAN" });
    }
    if (isForeignKeyConstraint(error)) {
      throw new Error(
        `Customer dengan kode "${kodecustomer}" masih dipakai transaksi lain, tidak bisa dihapus`,
        { cause: "MASIH_DIPAKAI" },
      );
    }
    throw error;
  }
}
