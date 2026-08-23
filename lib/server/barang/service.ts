import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import {
  deleteBarangByKode,
  findAllBarang,
  findBarangByKode,
  insertBarang,
  updateBarangByKode,
} from "@/lib/server/barang/repository";
import type { Barang, CreateBarangInput, UpdateBarangInput } from "@/lib/server/barang/types";

function isRecordNotFound(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

  return cocok;
}

function isForeignKeyConstraint(error: unknown): boolean {
  const cocok = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";

  return cocok;
}

function pesanTidakDitemukan(kodebarang: string): string {
  return `Barang dengan kode "${kodebarang}" tidak ditemukan`;
}

export async function listBarang(db: DatabasePerusahaanClient): Promise<Barang[]> {
  const rows = await findAllBarang(db);

  return rows;
}

export async function findBarang(db: DatabasePerusahaanClient, kodebarang: string): Promise<Barang | null> {
  const row = await findBarangByKode(db, kodebarang);

  return row;
}

export async function createBarang(db: DatabasePerusahaanClient, input: CreateBarangInput): Promise<Barang> {
  const namabarang = input.namabarang.trim();
  if (!namabarang) {
    throw new Error("Nama Barang tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
  }

  const satuan = input.satuan.trim();
  if (!satuan) {
    throw new Error("Satuan Barang tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
  }

  const barcode = input.barcode?.trim() || null;

  const barang = await simpanDenganKode(db, "barang", new Date(), (kode) =>
    insertBarang(db, kode, {
      namabarang,
      barcode,
      satuan,
      hargabeli: input.hargabeli,
      hargajual: input.hargajual,
      pakaistok: input.pakaistok ?? false,
    }),
  );

  return barang;
}

export async function updateBarang(
  db        : DatabasePerusahaanClient,
  kodebarang: string,
  input     : UpdateBarangInput,
): Promise<Barang> {
  const data: {
    namabarang?: string;
    barcode?   : string | null;
    satuan?    : string;
    hargabeli? : number;
    hargajual? : number;
    pakaistok? : boolean;
    status?    : number;
  } = {};

  if (input.namabarang !== undefined) {
    const namabarang = input.namabarang.trim();
    if (!namabarang) {
      throw new Error("Nama Barang tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
    }
    data.namabarang = namabarang;
  }

  if (input.barcode !== undefined) {
    data.barcode = input.barcode?.trim() || null;
  }

  if (input.satuan !== undefined) {
    const satuan = input.satuan.trim();
    if (!satuan) {
      throw new Error("Satuan Barang tidak boleh kosong", { cause: "INPUT_TIDAK_SAH" });
    }
    data.satuan = satuan;
  }

  if (input.hargabeli !== undefined) {
    data.hargabeli = input.hargabeli;
  }

  if (input.hargajual !== undefined) {
    data.hargajual = input.hargajual;
  }

  if (input.pakaistok !== undefined) {
    data.pakaistok = input.pakaistok;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  try {
    const row = await updateBarangByKode(db, kodebarang, data);

    return row;
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodebarang), { cause: "TIDAK_DITEMUKAN" });
    }
    throw error;
  }
}

export async function deleteBarang(db: DatabasePerusahaanClient, kodebarang: string): Promise<void> {
  try {
    await deleteBarangByKode(db, kodebarang);
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error(pesanTidakDitemukan(kodebarang), { cause: "TIDAK_DITEMUKAN" });
    }
    if (isForeignKeyConstraint(error)) {
      throw new Error(
        `Barang dengan kode "${kodebarang}" masih dipakai transaksi lain, tidak bisa dihapus`,
        { cause: "MASIH_DIPAKAI" },
      );
    }
    throw error;
  }
}
