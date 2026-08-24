"use client";

import { useRouter } from "next/navigation";

import KasForm from "@/app/transaksi/kas/components/KasForm";
import type { KasFormValues } from "@/app/transaksi/kas/lib/types";
import { createKas } from "@/lib/client/kas";

export default function KasFormPage() {
  const router = useRouter();

  async function handleSubmit(values: KasFormValues) {
    await createKas({
      tanggal   : values.tanggal,
      jenis     : values.jenis,
      kodelokasi: values.kodelokasi,
      rincian   : values.rincian.map((item) => ({
        keterangan: item.keterangan,
        nominal   : item.nominal,
      })),
    });

    router.push("/transaksi/kas");
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tambah Kas
        </h1>
        <p className="text-sm text-muted-foreground">
          Catat kas masuk atau kas keluar di luar transaksi penjualan dan pembelian.
        </p>
      </div>

      <KasForm mode="create" onSubmit={handleSubmit} />
    </>
  );
}
