import Dashboard from "@/app/components/Dashboard";
import { requireSession } from "@/lib/server/auth/guard";

export default async function Home() {
  const session = await requireSession();

  return <Dashboard userEmail={session.user.email} />;
}
