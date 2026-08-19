"use client";

import { useRouter } from "next/navigation";

import KasForm from "@/app/kas/components/KasForm";
import type { Kas } from "@/app/kas/lib/types";
import { createKas } from "@/lib/client/kas";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyKas: Kas = {
  kodekas   : "",
  tanggal   : todayIso(),
  jenis     : "MASUK",
  kodelokasi: "",
  namalokasi: "",
  nominal   : 0,
  keterangan: "",
  status    : "S",
};

export default function KasFormPage() {
  const router = useRouter();

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tambah Kas
        </h1>
        <p className="text-sm text-muted-foreground">
          Catat kas masuk atau kas keluar di luar transaksi penjualan.
        </p>
      </div>

      <KasForm
        initialValues = {emptyKas}
        mode          = "create"
        onSubmit      = {async (values) => {
          const created = await createKas(values);
          router.push(`/kas/${created.kodekas}`);
        }}
      />
    </>
  );
}
