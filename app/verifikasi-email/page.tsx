import Link from "next/link";

import ResendVerificationButton from "@/app/verifikasi-email/components/ResendVerificationButton";
import { getCurrentSession } from "@/lib/server/auth/guard";

type VerifikasiEmailPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function VerifikasiEmailPage({ searchParams }: VerifikasiEmailPageProps) {
  const { error } = await searchParams;
  const session = await getCurrentSession();
  const berhasil = !error;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xs ring-1 ring-slate-950/5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          POS Boilerplate
        </span>

        {berhasil ? (
          <>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Email Terverifikasi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Email Anda berhasil diverifikasi. Anda sekarang bisa melanjutkan menggunakan sistem.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Tautan Tidak Valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tautan verifikasi ini tidak valid atau sudah kedaluwarsa.
            </p>
            {session?.user.email && !session.user.emailVerified && (
              <ResendVerificationButton email={session.user.email} />
            )}
          </>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" href="/">
            Kembali ke Beranda
          </Link>
        </p>
      </div>
    </div>
  );
}
