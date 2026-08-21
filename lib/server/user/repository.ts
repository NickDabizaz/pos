import type { GlobalClient, PerusahaanMembership } from "@/lib/server/user/types";

/**
 * Seluruh Perusahaan tempat satu Pengguna terdaftar sebagai anggota, lewat tabel
 * userperusahaan — dijaga oleh FK `userperusahaan.iduser` ke `user.id` (lihat auth.prisma).
 */
export async function findMembershipsByUser(db: GlobalClient, iduser: string): Promise<PerusahaanMembership[]> {
  const rows = await db.userperusahaan.findMany({
    where  : { iduser },
    include: { perusahaan: true },
  });

  return rows.map((row) => ({
    idperusahaan  : row.perusahaan.idperusahaan,
    kodeperusahaan: row.perusahaan.kodeperusahaan,
    namaperusahaan: row.perusahaan.namaperusahaan,
    isowner       : row.isowner,
  }));
}
