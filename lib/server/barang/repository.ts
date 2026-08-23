import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { Barang } from "@/lib/server/barang/types";

type BarangRow = {
  idbarang  : number;
  kodebarang: string;
  namabarang: string;
  barcode   : string | null;
  satuan    : string;
  hargabeli : { toString(): string };
  hargajual : { toString(): string };
  pakaistok : boolean;
  status    : number;
};

function toBarang(row: BarangRow): Barang {
  return {
    idbarang  : row.idbarang,
    kodebarang: row.kodebarang,
    namabarang: row.namabarang,
    barcode   : row.barcode,
    satuan    : row.satuan,
    hargabeli : Number(row.hargabeli),
    hargajual : Number(row.hargajual),
    pakaistok : row.pakaistok,
    status    : row.status,
  };
}

export async function findAllBarang(db: DatabasePerusahaanClient): Promise<Barang[]> {
  const rows = await db.barang.findMany({ orderBy: { idbarang: "asc" } });

  return rows.map(toBarang);
}

export async function findBarangByKode(db: DatabasePerusahaanClient, kodebarang: string): Promise<Barang | null> {
  const row = await db.barang.findUnique({ where: { kodebarang } });

  return row ? toBarang(row) : null;
}

export async function insertBarang(
  db        : DatabasePerusahaanClient,
  kodebarang: string,
  data      : { namabarang: string; barcode: string | null; satuan: string; hargabeli: number; hargajual: number; pakaistok: boolean },
): Promise<Barang> {
  const row = await db.barang.create({ data: { kodebarang, ...data } });

  return toBarang(row);
}

export async function updateBarangByKode(
  db        : DatabasePerusahaanClient,
  kodebarang: string,
  data      : { namabarang?: string; barcode?: string | null; satuan?: string; hargabeli?: number; hargajual?: number; pakaistok?: boolean; status?: number },
): Promise<Barang> {
  const row = await db.barang.update({ where: { kodebarang }, data });

  return toBarang(row);
}

export async function deleteBarangByKode(db: DatabasePerusahaanClient, kodebarang: string): Promise<void> {
  await db.barang.delete({ where: { kodebarang } });
}
