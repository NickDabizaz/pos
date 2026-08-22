import PilihPerusahaanCards from "@/app/pilih-perusahaan/components/PilihPerusahaanCards";
import { prisma } from "@/lib/prisma";
import { requireSudahPunyaPerusahaan } from "@/lib/server/auth/guard";
import { findPerusahaanByUser } from "@/lib/server/user/repository";

export default async function PilihPerusahaanPage() {
  const session = await requireSudahPunyaPerusahaan();
  const memberships = await findPerusahaanByUser(prisma, session.user.id);

  return <PilihPerusahaanCards memberships={memberships} />;
}
