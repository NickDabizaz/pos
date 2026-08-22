"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { pilihPerusahaanAktif } from "@/lib/client/perusahaan";
import type { PerusahaanMembership } from "@/lib/server/user/types";

type Props = {
  memberships: PerusahaanMembership[];
};

export default function PilihPerusahaanCards({ memberships }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError]           = useState<string | null>(null);
  const [idperusahaanDiproses, setIdperusahaan] = useState<number | null>(null);

  async function handlePilih(idperusahaan: number) {
    setSubmitError(null);
    setIdperusahaan(idperusahaan);

    try {
      await pilihPerusahaanAktif(idperusahaan);
      router.push("/");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal memilih Perusahaan. Coba lagi.");
      setIdperusahaan(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pilih Perusahaan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pilih Perusahaan yang ingin Anda masuki.</p>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {submitError}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {memberships.map((membership) => (
            <button
              className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-xs ring-1 ring-slate-950/5 transition-colors hover:border-ring disabled:cursor-not-allowed disabled:opacity-60"
              disabled={idperusahaanDiproses !== null}
              key={membership.idperusahaan}
              onClick={() => handlePilih(membership.idperusahaan)}
              type="button"
            >
              <p className="font-semibold text-foreground">{membership.namaperusahaan}</p>
              <p className="text-sm text-muted-foreground">
                {membership.kodeperusahaan}
                {membership.isowner ? " · Owner" : ""}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
