import ManajemenUserPage from "@/app/manajemen-user/components/ManajemenUserPage";
import { requireOwnerPerusahaanAktif } from "@/lib/server/auth/guard";

export default async function Page() {
  await requireOwnerPerusahaanAktif();

  return <ManajemenUserPage />;
}
