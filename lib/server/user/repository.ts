import type { GlobalClient, PerusahaanMembership } from "@/lib/server/user/types";

export async function findPerusahaanByUser(db: GlobalClient, iduser: string): Promise<PerusahaanMembership[]> {
  const rows = await db.userperusahaan.findMany({
    where  : { iduser },
    include: { perusahaan: true },
  });

  return rows.map((row) => ({
    idperusahaan  : row.perusahaan.idperusahaan,
    kodeperusahaan: row.perusahaan.kodeperusahaan,
    namaperusahaan: row.perusahaan.namaperusahaan,
    isowner       : row.isowner,
    status        : row.perusahaan.status,
  }));
}
