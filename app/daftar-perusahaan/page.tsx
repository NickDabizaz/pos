import DaftarPerusahaanForm from "@/app/daftar-perusahaan/components/DaftarPerusahaanForm";
import VerifikasiEmailGate from "@/app/daftar-perusahaan/components/VerifikasiEmailGate";
import { requireBelumPunyaPerusahaan } from "@/lib/server/auth/guard";

export default async function DaftarPerusahaanPage() {
  const session = await requireBelumPunyaPerusahaan();

  if (!session.user.emailVerified) {
    return <VerifikasiEmailGate email={session.user.email} />;
  }

  return <DaftarPerusahaanForm />;
}
