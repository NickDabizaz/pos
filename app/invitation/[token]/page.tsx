import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/auth/guard";
import { cekInvitationBerlaku } from "@/lib/server/invitation/service";
import GabungButton from "@/app/invitation/[token]/components/GabungButton";
import InvitationRegisterForm from "@/app/invitation/[token]/components/InvitationRegisterForm";

type PageParams = { params: Promise<{ token: string }> };

export default async function InvitationPage({ params }: PageParams) {
  const { token } = await params;

  let namaperusahaan: string;
  try {
    ({ namaperusahaan } = await cekInvitationBerlaku(prisma, token));
  } catch (error) {
    const pesan = error instanceof Error ? error.message : "Link invitation tidak valid";

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xs ring-1 ring-slate-950/5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Link Invitation Tidak Valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">{pesan}</p>
        </div>
      </div>
    );
  }

  const session = await getCurrentSession();

  return session ? (
    <GabungButton namaperusahaan={namaperusahaan} token={token} />
  ) : (
    <InvitationRegisterForm namaperusahaan={namaperusahaan} token={token} />
  );
}
