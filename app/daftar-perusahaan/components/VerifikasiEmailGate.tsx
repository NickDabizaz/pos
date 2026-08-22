"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ResendVerificationButton from "@/app/verifikasi-email/components/ResendVerificationButton";
import { authClient } from "@/lib/client/auth";

type VerifikasiEmailGateProps = {
  email: string;
};

export default function VerifikasiEmailGate({ email }: VerifikasiEmailGateProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleKeluar() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/register");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xs ring-1 ring-slate-950/5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Verifikasi Email Dulu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda perlu memverifikasi email sebelum bisa mendaftarkan Perusahaan. Cek kotak masuk email berikut:
        </p>
        <p className="mt-1 break-all text-sm font-medium text-foreground">{email}</p>

        <ResendVerificationButton email={email} />

        <button
          className="mt-4 text-xs font-medium text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSigningOut}
          onClick={handleKeluar}
          type="button"
        >
          {isSigningOut ? "Keluar..." : "Salah ketik email? Keluar dan daftar ulang"}
        </button>
      </div>
    </div>
  );
}
