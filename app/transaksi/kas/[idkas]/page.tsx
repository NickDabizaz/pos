"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import KasForm from "@/app/transaksi/kas/components/KasForm";
import type { KasFormValues } from "@/app/transaksi/kas/lib/types";
import { fetchKasByKode } from "@/lib/client/kas";
import type { Kas } from "@/lib/server/kas/types";

function toFormValues(kas: Kas): KasFormValues {
  return {
    tanggal   : kas.tanggal,
    jenis     : kas.jenis,
    kodelokasi: kas.kodelokasi,
    namalokasi: kas.namalokasi,
    rincian   : kas.rincian,
  };
}

export default function KasDetailPage() {
  const router = useRouter();
  const params = useParams<{ idkas: string }>();
  const [kas, setKas] = useState<Kas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchKasByKode(params.idkas);

        if (isMounted) {
          setKas(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data kas");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [params.idkas]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat data...</p>;
  }

  if (loadError || !kas) {
    return (
      <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
        {loadError ?? "Kas tidak ditemukan"}
      </p>
    );
  }

  const isCancelled = kas.status === "D";

  return (
    <>
      <button
        className="mb-6 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        onClick={() => router.push("/transaksi/kas")}
        type="button"
      >
        &larr; Kembali ke daftar Kas
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {kas.kodekas}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detail entri kas.
          </p>
        </div>

        {isCancelled && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 text-xs font-medium text-status-danger-fg">
            <span className="size-1.5 rounded-full bg-status-danger-dot" />
            Dibatalkan
          </span>
        )}
      </div>

      {isCancelled && (
        <div className="mb-4 rounded-xl border border-status-danger-border bg-status-danger-bg/70 px-3.5 py-2.5">
          <p className="text-sm text-status-danger-fg">
            <span className="font-semibold">Alasan pembatalan:</span>{" "}
            {kas.alasanbatal || "Tidak ada alasan yang dicatat."}
          </p>
        </div>
      )}

      <KasForm initialValues={toFormValues(kas)} mode="view" />
    </>
  );
}
