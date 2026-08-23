"use client";

import { useRouter } from "next/navigation";

import PembelianForm from "@/app/transaksi/pembelian/components/PembelianForm";
import type { PembelianFormValues } from "@/app/transaksi/pembelian/lib/types";
import { createPembelian } from "@/lib/client/pembelian";

export default function PembelianFormPage() {
  const router = useRouter();

  async function handleSubmit(values: PembelianFormValues) {
    await createPembelian({
      tanggal     : values.tanggal,
      kodesupplier: values.kodesupplier,
      kodelokasi  : values.kodelokasi,
      items: values.items.map((item) => ({
        kodebarang: item.kodebarang,
        qty       : item.qty,
        harga     : item.harga,
        pakaiPpn  : item.pakaiPpn,
        diskon    : item.diskon,
      })),
    });

    router.push("/transaksi/pembelian");
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tambah Pembelian
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat transaksi pembelian baru dengan memilih Lokasi, supplier, dan barang.
        </p>
      </div>

      <PembelianForm mode="create" onSubmit={handleSubmit} />
    </>
  );
}
