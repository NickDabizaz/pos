import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";

/**
 * Nama Lokasi untuk keterangan header dokumen. `undefined` (tak ada filter) -> `null` (= "Semua").
 * `[]` -> `[]`. Daftar id -> nama Lokasi terkait, urut sesuai `idlokasi` naik.
 */
export async function resolveNamaLokasi(
  db      : DatabasePerusahaanClient,
  idlokasi: number[] | undefined,
): Promise<string[] | null> {
  if (idlokasi === undefined) {
    return null;
  }
  if (idlokasi.length === 0) {
    return [];
  }

  const rows = await db.lokasi.findMany({
    where  : { idlokasi: { in: idlokasi } },
    orderBy: { idlokasi: "asc" },
    select : { namalokasi: true },
  });

  return rows.map((row) => row.namalokasi);
}
