import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { Lokasi } from "@/lib/server/lokasi/types";

export async function findAllLokasi(db: DatabasePerusahaanClient): Promise<Lokasi[]> {
  const rows = await db.lokasi.findMany({ orderBy: { idlokasi: "asc" } });

  return rows;
}

export async function findLokasiByKode(db: DatabasePerusahaanClient, kodelokasi: string): Promise<Lokasi | null> {
  const row = await db.lokasi.findUnique({ where: { kodelokasi } });

  return row;
}

export async function insertLokasi(
  db        : DatabasePerusahaanClient,
  kodelokasi: string,
  namalokasi: string,
  keterangan: string | null,
): Promise<Lokasi> {
  const row = await db.lokasi.create({ data: { kodelokasi, namalokasi, keterangan } });

  return row;
}

export async function updateLokasiByKode(
  db        : DatabasePerusahaanClient,
  kodelokasi: string,
  data      : { namalokasi?: string; keterangan?: string | null },
): Promise<Lokasi> {
  const row = await db.lokasi.update({ where: { kodelokasi }, data });

  return row;
}

export async function deleteLokasiByKode(db: DatabasePerusahaanClient, kodelokasi: string): Promise<void> {
  await db.lokasi.delete({ where: { kodelokasi } });
}
