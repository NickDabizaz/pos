"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PenjualanForm from "@/app/penjualan/components/PenjualanForm";
import type { Penjualan } from "@/app/penjualan/lib/types";
import { fetchPenjualanByKode, updatePenjualan } from "@/lib/client/penjualan";

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

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {params.idjual}
        </h1>
        <p className="text-sm text-muted-foreground">
          Detail transaksi penjualan. Ubah data lalu simpan untuk memperbarui.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      ) : loadError || !penjualan ? (
        <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
          {loadError ?? "Penjualan tidak ditemukan"}
        </p>
      ) : (
        <PenjualanForm
          initialValues = {penjualan}
          mode          = "edit"
          onSubmit      = {async (values) => {
            const updated = await updatePenjualan(penjualan.kodejual, values);
            setPenjualan(updated);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
