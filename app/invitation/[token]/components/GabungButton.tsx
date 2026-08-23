"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { gabungViaInvitation } from "@/lib/client/invitation";

type GabungButtonProps = {
  namaperusahaan: string;
  token         : string;
};

export default function GabungButton({ namaperusahaan, token }: GabungButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGabung() {
    setIsSubmitting(true);
    setError(null);

    try {
      await gabungViaInvitation(token);
      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal bergabung ke Perusahaan");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xs ring-1 ring-slate-950/5">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Invitation Bergabung</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda diundang untuk bergabung sebagai anggota <strong>{namaperusahaan}</strong>.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {error}
          </p>
        )}

        <button
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={handleGabung}
          type="button"
        >
          {isSubmitting ? "Memproses..." : `Gabung ke ${namaperusahaan}`}
        </button>
      </div>
    </div>
  );
}
