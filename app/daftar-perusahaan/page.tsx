import DaftarPerusahaanForm from "@/app/daftar-perusahaan/components/DaftarPerusahaanForm";
import { requireBelumPunyaPerusahaan } from "@/lib/server/auth/guard";

export default async function DaftarPerusahaanPage() {
  await requireBelumPunyaPerusahaan();

  return <DaftarPerusahaanForm />;
}
