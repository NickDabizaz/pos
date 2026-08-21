import { findMembershipsByUser } from "@/lib/server/user/repository";
import type { GlobalClient, PerusahaanMembership } from "@/lib/server/user/types";

/** Seluruh Perusahaan tempat satu Pengguna terdaftar sebagai anggota. */
export async function listMembershipsForUser(db: GlobalClient, iduser: string): Promise<PerusahaanMembership[]> {
  return findMembershipsByUser(db, iduser);
}
