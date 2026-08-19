"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import KasForm from "@/app/kas/components/KasForm";
import type { Kas } from "@/app/kas/lib/types";
import { fetchKasByKode, updateKas } from "@/lib/client/kas";

export default function KasDetailPage() {
  const router = useRouter();
  const params = useParams<{ kodekas: string }>();
  const [kas, setKas] = useState<Kas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchKasByKode(params.kodekas);

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
  }, [params.kodekas]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {params.kodekas}
        </h1>
        <p className="text-sm text-muted-foreground">
          Detail entri kas. Ubah data lalu simpan untuk memperbarui.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      ) : loadError || !kas ? (
        <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
          {loadError ?? "Kas tidak ditemukan"}
        </p>
      ) : (
        <KasForm
          initialValues = {kas}
          mode          = "edit"
          onSubmit      = {async (values) => {
            const updated = await updateKas(kas.kodekas, values);
            setKas(updated);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
