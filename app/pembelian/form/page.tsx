"use client";

import { useRouter } from "next/navigation";

import PembelianForm from "@/app/pembelian/components/PembelianForm";
import type { Pembelian } from "@/app/pembelian/lib/types";
import { createPembelian } from "@/lib/client/pembelian";
import { getDefaultTransactionDate } from "@/lib/server/transaksi/constants";

const emptyPembelian: Pembelian = {
  kodebeli    : "",
  tanggal     : getDefaultTransactionDate(),
  kodesupplier: "",
  namasupplier: "",
  items       : [],
  total       : 0,
  diskon      : 0,
  ppn         : 0,
  grandtotal  : 0,
  status      : "S",
};

export default function PembelianFormPage() {
  const router = useRouter();

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tambah Pembelian
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat transaksi pembelian baru dengan memilih supplier dan barang.
        </p>
      </div>

      <PembelianForm
        initialValues = {emptyPembelian}
        mode          = "create"
        onSubmit      = {async (values) => {
          const created = await createPembelian(values);
          router.push(`/pembelian/${created.kodebeli}`);
        }}
      />
    </>
  );
}
