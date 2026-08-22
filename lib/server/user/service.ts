import { findPerusahaanByUser } from "@/lib/server/user/repository";
import type { GlobalClient, PerusahaanMembership } from "@/lib/server/user/types";

export async function listMembershipsForUser(db: GlobalClient, iduser: string): Promise<PerusahaanMembership[]> {
  return findPerusahaanByUser(db, iduser);
}
