"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PenjualanForm from "@/app/transaksi/penjualan/components/PenjualanForm";
import type { PenjualanFormValues } from "@/app/transaksi/penjualan/lib/types";
import { fetchPenjualanByKode } from "@/lib/client/penjualan";
import type { Penjualan } from "@/lib/server/penjualan/types";

function toFormValues(penjualan: Penjualan): PenjualanFormValues {
  return {
    tanggal     : penjualan.tanggal,
    kodecustomer: penjualan.kodecustomer,
    namacustomer: penjualan.namacustomer,
    kodelokasi  : penjualan.kodelokasi,
    namalokasi  : penjualan.namalokasi,
    items       : penjualan.items,
  };
}

export default function PenjualanDetailPage() {
  const router = useRouter();
  const params = useParams<{ idjual: string }>();
  const [penjualan, setPenjualan] = useState<Penjualan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchPenjualanByKode(params.idjual);

        if (isMounted) {
          setPenjualan(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data penjualan");
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
  }, [params.idjual]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat data...</p>;
  }

  if (loadError || !penjualan) {
    return (
      <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
        {loadError ?? "Penjualan tidak ditemukan"}
      </p>
    );
  }

  const isCancelled = penjualan.status === "D";

  return (
    <>
      <button
        className="mb-6 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        onClick={() => router.push("/transaksi/penjualan")}
        type="button"
      >
        &larr; Kembali ke daftar Penjualan
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {penjualan.kodejual}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detail transaksi penjualan.
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
            {penjualan.alasanbatal || "Tidak ada alasan yang dicatat."}
          </p>
        </div>
      )}

      <PenjualanForm initialValues={toFormValues(penjualan)} mode="view" />
    </>
  );
}
