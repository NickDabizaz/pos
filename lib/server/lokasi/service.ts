import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import {
  deleteLokasiByKode,
  findAllLokasi,
  findLokasiByKode,
  insertLokasi,
  updateLokasiByKode,
} from "@/lib/server/lokasi/repository";
import type { CreateLokasiInput, Lokasi, UpdateLokasiInput } from "@/lib/server/lokasi/types";

function isRecordNotFound(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

  return cocok;
}

function isForeignKeyConstraint(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";

  return cocok;
}

function pesanTidakDitemukan(kodelokasi: string): string {
  return `Lokasi dengan kode "${kodelokasi}" tidak ditemukan`;
}

export async function listLokasi(db: DatabasePerusahaanClient): Promise<Lokasi[]> {
  const rows = await findAllLokasi(db);

  return rows;
}

export async function findLokasi(db: DatabasePerusahaanClient, kodelokasi: string): Promise<Lokasi | null> {
  const row = await findLokasiByKode(db, kodelokasi);

  return row;
}

export async function createLokasi(db: DatabasePerusahaanClient, input: CreateLokasiInput): Promise<Lokasi> {
  const namalokasi = input.namalokasi.trim();
  if (!namalokasi) {
    throw new Error("Nama Lokasi tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
  }

  const keterangan = input.keterangan?.trim() || null;

  const lokasi = await simpanDenganKode(db, "lokasi", new Date(), (kode) =>
    insertLokasi(db, kode, namalokasi, keterangan),
  );

  return lokasi;
}

export async function updateLokasi(
  db        : DatabasePerusahaanClient,
  kodelokasi: string,
  input     : UpdateLokasiInput,
): Promise<Lokasi> {
  const data: { namalokasi?: string; keterangan?: string | null; status?: number } = {};

  if (input.namalokasi !== undefined) {
    const namalokasi = input.namalokasi.trim();
    if (!namalokasi) {
      throw new Error("Nama Lokasi tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
    }
    data.namalokasi = namalokasi;
  }

  if (input.keterangan !== undefined) {
    data.keterangan = input.keterangan?.trim() || null;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  try {
    const row = await updateLokasiByKode(db, kodelokasi, data);

    return row;
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodelokasi), { cause: "TIDAK_DITEMUKAN" });
    }
    throw error;
  }
}

export async function deleteLokasi(db: DatabasePerusahaanClient, kodelokasi: string): Promise<void> {
  try {
    await deleteLokasiByKode(db, kodelokasi);
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodelokasi), { cause: "TIDAK_DITEMUKAN" });
    }
    if (isForeignKeyConstraint(error)) {
      throw new Error(
        `Lokasi dengan kode "${kodelokasi}" masih dipakai transaksi lain, tidak bisa dihapus`,
        { cause: "MASIH_DIPAKAI" },
      );
    }
    throw error;
  }
}
