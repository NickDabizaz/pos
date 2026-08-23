import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import {
  deleteSupplierByKode,
  findAllSupplier,
  findSupplierByKode,
  insertSupplier,
  updateSupplierByKode,
} from "@/lib/server/supplier/repository";
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from "@/lib/server/supplier/types";

function isRecordNotFound(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

  return cocok;
}

function isForeignKeyConstraint(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";

  return cocok;
}

function pesanTidakDitemukan(kodesupplier: string): string {
  return `Supplier dengan kode "${kodesupplier}" tidak ditemukan`;
}

export async function listSupplier(db: DatabasePerusahaanClient): Promise<Supplier[]> {
  const rows = await findAllSupplier(db);

  return rows;
}

export async function findSupplier(db: DatabasePerusahaanClient, kodesupplier: string): Promise<Supplier | null> {
  const row = await findSupplierByKode(db, kodesupplier);

  return row;
}

export async function createSupplier(db: DatabasePerusahaanClient, input: CreateSupplierInput): Promise<Supplier> {
  const namasupplier = input.namasupplier.trim();
  if (!namasupplier) {
    throw new Error("Nama Supplier tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
  }

  const kontakperson = input.kontakperson?.trim() || null;
  const telepon = input.telepon?.trim() || null;
  const email = input.email?.trim() || null;
  const alamat = input.alamat?.trim() || null;

  const supplier = await simpanDenganKode(db, "supplier", new Date(), (kode) =>
    insertSupplier(db, kode, namasupplier, kontakperson, telepon, email, alamat),
  );

  return supplier;
}

export async function updateSupplier(
  db          : DatabasePerusahaanClient,
  kodesupplier: string,
  input       : UpdateSupplierInput,
): Promise<Supplier> {
  const data: {
    namasupplier?: string;
    kontakperson?: string | null;
    telepon?     : string | null;
    email?       : string | null;
    alamat?      : string | null;
    status?      : number;
  } = {};

  if (input.namasupplier !== undefined) {
    const namasupplier = input.namasupplier.trim();
    if (!namasupplier) {
      throw new Error("Nama Supplier tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
    }
    data.namasupplier = namasupplier;
  }

  if (input.kontakperson !== undefined) {
    data.kontakperson = input.kontakperson?.trim() || null;
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
    const row = await updateSupplierByKode(db, kodesupplier, data);

    return row;
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodesupplier), { cause: "TIDAK_DITEMUKAN" });
    }
    throw error;
  }
}

export async function deleteSupplier(db: DatabasePerusahaanClient, kodesupplier: string): Promise<void> {
  try {
    await deleteSupplierByKode(db, kodesupplier);
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodesupplier), { cause: "TIDAK_DITEMUKAN" });
    }
    if (isForeignKeyConstraint(error)) {
      throw new Error(
        `Supplier dengan kode "${kodesupplier}" masih dipakai transaksi lain, tidak bisa dihapus`,
        { cause: "MASIH_DIPAKAI" },
      );
    }
    throw error;
  }
}
