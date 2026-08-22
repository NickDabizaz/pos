import SubscriptionPage from "@/app/subscription/components/SubscriptionPage";
import { prisma } from "@/lib/prisma";
import { requireSudahPunyaPerusahaan } from "@/lib/server/auth/guard";
import { listMembershipsForUser } from "@/lib/server/user/service";

export default async function Page() {
  const session = await requireSudahPunyaPerusahaan();
  const [membership] = await listMembershipsForUser(prisma, session.user.id);

  return <SubscriptionPage idperusahaan={membership.idperusahaan} />;
}
