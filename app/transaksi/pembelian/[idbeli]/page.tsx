"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PembelianForm from "@/app/transaksi/pembelian/components/PembelianForm";
import type { PembelianFormValues } from "@/app/transaksi/pembelian/lib/types";
import { fetchPembelianByKode, updatePembelian } from "@/lib/client/pembelian";
import type { Pembelian } from "@/lib/server/pembelian/types";

function toFormValues(pembelian: Pembelian): PembelianFormValues {
  return {
    tanggal     : pembelian.tanggal,
    kodesupplier: pembelian.kodesupplier,
    namasupplier: pembelian.namasupplier,
    kodelokasi  : pembelian.kodelokasi,
    namalokasi  : pembelian.namalokasi,
    items       : pembelian.items,
  };
}

export default function PembelianDetailPage() {
  const router = useRouter();
  const params = useParams<{ idbeli: string }>();
  const [pembelian, setPembelian] = useState<Pembelian | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchPembelianByKode(params.idbeli);

        if (isMounted) {
          setPembelian(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data pembelian");
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
  }, [params.idbeli]);

  async function handleUpdate(values: PembelianFormValues) {
    if (!pembelian) return;

    const updated = await updatePembelian(pembelian.kodebeli, {
      kodesupplier: values.kodesupplier,
      items: values.items.map((item) => ({
        kodebarang: item.kodebarang,
        qty       : item.qty,
        harga     : item.harga,
        pakaiPpn  : item.pakaiPpn,
        diskon    : item.diskon,
      })),
    });

    setPembelian(updated);
    setMode("view");
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat data...</p>;
  }

  if (loadError || !pembelian) {
    return (
      <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
        {loadError ?? "Pembelian tidak ditemukan"}
      </p>
    );
  }

  const isCancelled = pembelian.status === "D";

  return (
    <>
      <button
        className="mb-6 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        onClick={() => router.push("/transaksi/pembelian")}
        type="button"
      >
        &larr; Kembali ke daftar Pembelian
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {pembelian.kodebeli}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detail transaksi pembelian.
          </p>
        </div>

        {isCancelled && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 text-xs font-medium text-status-danger-fg">
            <span className="size-1.5 rounded-full bg-status-danger-dot" />
            Dibatalkan
          </span>
        )}

        {!isCancelled && mode === "view" && (
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={() => setMode("edit")}
            type="button"
          >
            Ubah
          </button>
        )}
      </div>

      {isCancelled && (
        <div className="mb-4 rounded-xl border border-status-danger-border bg-status-danger-bg/70 px-3.5 py-2.5">
          <p className="text-sm text-status-danger-fg">
            <span className="font-semibold">Alasan pembatalan:</span>{" "}
            {pembelian.alasanbatal || "Tidak ada alasan yang dicatat."}
          </p>
        </div>
      )}

      <PembelianForm
        initialValues = {toFormValues(pembelian)}
        key          = {`${pembelian.kodebeli}:${mode}`}
        mode          = {mode}
        onSubmit      = {mode === "edit" ? handleUpdate : undefined}
      />
    </>
  );
}
