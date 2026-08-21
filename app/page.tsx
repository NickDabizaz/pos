import Dashboard from "@/app/components/Dashboard";
import { requireSudahPunyaPerusahaan } from "@/lib/server/auth/guard";

export default async function Home() {
  const session = await requireSudahPunyaPerusahaan();

  return <Dashboard userEmail={session.user.email} />;
}
