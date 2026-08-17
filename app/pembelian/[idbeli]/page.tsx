"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PembelianForm from "@/app/pembelian/components/PembelianForm";
import type { Pembelian } from "@/app/pembelian/lib/types";
import { fetchPembelianByKode, updatePembelian } from "@/lib/client/pembelian";

export default function PembelianDetailPage() {
  const router = useRouter();
  const params = useParams<{ idbeli: string }>();
  const [pembelian, setPembelian] = useState<Pembelian | null>(null);
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

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {params.idbeli}
        </h1>
        <p className="text-sm text-muted-foreground">
          Detail transaksi pembelian. Ubah data lalu simpan untuk memperbarui.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      ) : loadError || !pembelian ? (
        <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
          {loadError ?? "Pembelian tidak ditemukan"}
        </p>
      ) : (
        <PembelianForm
          initialValues = {pembelian}
          mode          = "edit"
          onSubmit      = {async (values) => {
            const updated = await updatePembelian(pembelian.kodebeli, values);
            setPembelian(updated);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
