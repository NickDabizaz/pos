"use client";

import { useRouter } from "next/navigation";

import PenjualanForm from "@/app/penjualan/components/PenjualanForm";
import type { Penjualan } from "@/app/penjualan/lib/types";
import { createPenjualan } from "@/lib/client/penjualan";
import { getDefaultTransactionDate } from "@/lib/server/transaksi/constants";

const emptyPenjualan: Penjualan = {
  kodejual      : "",
  tanggal       : getDefaultTransactionDate(),
  jenistransaksi: "PESANAN",
  kodecustomer  : "",
  namacustomer  : "",
  items         : [],
  total         : 0,
  diskon        : 0,
  ppn           : 0,
  grandtotal    : 0,
  status        : "S",
};

export default function PenjualanFormPage() {
  const router = useRouter();

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tambah Penjualan
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat transaksi penjualan baru dengan memilih customer dan barang.
        </p>
      </div>

      <PenjualanForm
        initialValues = {emptyPenjualan}
        mode          = "create"
        onSubmit      = {async (values) => {
          const created = await createPenjualan(values);
          router.push(`/penjualan/${created.kodejual}`);
        }}
      />
    </>
  );
}
