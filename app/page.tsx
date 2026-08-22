import Dashboard from "@/app/components/Dashboard";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";

export default async function Home() {
  const session = await requirePerusahaanAktif();

  return <Dashboard userEmail={session.user.email} />;
}
