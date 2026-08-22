import SubscriptionPage from "@/app/subscription/components/SubscriptionPage";
import { prisma } from "@/lib/prisma";
import { requireSudahPunyaPerusahaan } from "@/lib/server/auth/guard";
import { findPerusahaanByUser } from "@/lib/server/user/repository";

export default async function Page() {
  const session = await requireSudahPunyaPerusahaan();
  const [membership] = await findPerusahaanByUser(prisma, session.user.id);

  return <SubscriptionPage idperusahaan={membership.idperusahaan} />;
}
