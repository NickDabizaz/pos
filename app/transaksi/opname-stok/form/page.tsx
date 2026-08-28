"use client";

import { useRouter } from "next/navigation";

import OpnameStokForm from "@/app/transaksi/opname-stok/components/OpnameStokForm";
import type { OpnameStokFormValues } from "@/app/transaksi/opname-stok/lib/types";
import { createOpnameStok } from "@/lib/client/opnameStok";

export default function OpnameStokFormPage() {
  const router = useRouter();

  async function handleSubmit(values: OpnameStokFormValues) {
    await createOpnameStok({
      tanggal   : values.tanggal,
      kodelokasi: values.kodelokasi,
      items     : values.rows.map((row) => ({ kodebarang: row.kodebarang, jmlfisik: row.jmlfisik })),
    });

    router.push("/transaksi/opname-stok");
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tambah Opname Stok
        </h1>
        <p className="text-sm text-muted-foreground">
          Catat hasil hitung fisik barang di satu Lokasi pada satu tanggal.
        </p>
      </div>

      <OpnameStokForm mode="create" onSubmit={handleSubmit} />
    </>
  );
}
