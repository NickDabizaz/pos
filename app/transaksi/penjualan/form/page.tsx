"use client";

import { useRouter } from "next/navigation";

import PenjualanForm from "@/app/transaksi/penjualan/components/PenjualanForm";
import type { PenjualanFormValues } from "@/app/transaksi/penjualan/lib/types";
import { createPenjualan } from "@/lib/client/penjualan";

export default function PenjualanFormPage() {
  const router = useRouter();

  async function handleSubmit(values: PenjualanFormValues) {
    await createPenjualan({
      tanggal       : values.tanggal,
      jenistransaksi: "PESANAN",
      kodecustomer  : values.kodecustomer,
      kodelokasi    : values.kodelokasi,
      items: values.items.map((item) => ({
        kodebarang: item.kodebarang,
        qty       : item.qty,
        harga     : item.harga,
        pakaiPpn  : item.pakaiPpn,
        diskon    : item.diskon,
      })),
    });

    router.push("/transaksi/penjualan");
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tambah Penjualan
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat transaksi penjualan baru dengan memilih Lokasi, customer, dan barang.
        </p>
      </div>

      <PenjualanForm mode="create" onSubmit={handleSubmit} />
    </>
  );
}
