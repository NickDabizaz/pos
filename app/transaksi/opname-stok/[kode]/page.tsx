"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import OpnameStokForm from "@/app/transaksi/opname-stok/components/OpnameStokForm";
import type { OpnameStokFormValues } from "@/app/transaksi/opname-stok/lib/types";
import { fetchOpnameStokByKode, updateOpnameStok } from "@/lib/client/opnameStok";
import type { OpnameStok } from "@/lib/server/opnamestok/types";

function toFormValues(opname: OpnameStok): OpnameStokFormValues {
  return {
    tanggal   : opname.tanggal,
    kodelokasi: opname.kodelokasi,
    namalokasi: opname.namalokasi,
    rows: opname.items.map((item) => ({
      kodebarang: item.kodebarang,
      namabarang: item.namabarang,
      satuan    : item.satuan,
      jmlsistem : item.jmlsistem,
      jmlfisik  : item.jmlfisik,
    })),
  };
}

export default function OpnameStokDetailPage() {
  const router = useRouter();
  const params = useParams<{ kode: string }>();
  const [opname, setOpname]       = useState<OpnameStok | null>(null);
  const [mode, setMode]           = useState<"view" | "edit">("view");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchOpnameStokByKode(params.kode)
      .then((data) => {
        if (isMounted) setOpname(data);
      })
      .catch((error) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : "Gagal memuat data opname stok");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.kode]);

  async function handleUpdate(values: OpnameStokFormValues) {
    if (!opname) return;

    const updated = await updateOpnameStok(opname.kodeopname, {
      items: values.rows.map((row) => ({ kodebarang: row.kodebarang, jmlfisik: row.jmlfisik })),
    });

    setOpname(updated);
    setMode("view");
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat data...</p>;
  }

  if (loadError || !opname) {
    return (
      <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
        {loadError ?? "Opname stok tidak ditemukan"}
      </p>
    );
  }

  const isCancelled = opname.status === "D";

  return (
    <>
      <button
        className="mb-6 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        onClick={() => router.push("/transaksi/opname-stok")}
        type="button"
      >
        &larr; Kembali ke daftar Opname Stok
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{opname.kodeopname}</h1>
          <p className="text-sm text-muted-foreground">Detail dokumen opname stok.</p>
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
            {opname.alasanbatal || "Tidak ada alasan yang dicatat."}
          </p>
        </div>
      )}

      <OpnameStokForm
        initialValues = {toFormValues(opname)}
        key           = {`${opname.kodeopname}:${mode}`}
        mode          = {mode}
        onSubmit      = {mode === "edit" ? handleUpdate : undefined}
      />
    </>
  );
}
