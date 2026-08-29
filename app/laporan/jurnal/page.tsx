"use client";

import { useRef, useState } from "react";

import { buatUrlLaporanJurnal, type FilterJurnalState } from "@/lib/client/laporan/jurnal";

const filterAwal: FilterJurnalState = { kodetrans: "", dari: "", sampai: "" };

export default function LaporanJurnalPage() {
  const [filter, setFilter] = useState<FilterJurnalState>(filterAwal);
  const [src, setSrc] = useState(() => buatUrlLaporanJurnal(filterAwal));
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleTampilkan() {
    setSrc(buatUrlLaporanJurnal(filter));
  }

  function handleCetak() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div className="flex h-screen flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">Laporan Jurnal Transaksi</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Kode Transaksi
          <input
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
            onChange={(event) => setFilter((current) => ({ ...current, kodetrans: event.target.value }))}
            placeholder="mis. JL2608"
            type="text"
            value={filter.kodetrans}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Dari Tanggal
          <input
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
            onChange={(event) => setFilter((current) => ({ ...current, dari: event.target.value }))}
            type="date"
            value={filter.dari}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Sampai Tanggal
          <input
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
            onChange={(event) => setFilter((current) => ({ ...current, sampai: event.target.value }))}
            type="date"
            value={filter.sampai}
          />
        </label>

        <div className="ml-auto flex gap-2">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={handleTampilkan}
            type="button"
          >
            Tampilkan
          </button>
          <button
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={handleCetak}
            type="button"
          >
            Cetak
          </button>
        </div>
      </div>

      <iframe className="w-full flex-1 rounded-lg border border-border bg-white" ref={iframeRef} src={src} title="Laporan Jurnal Transaksi" />
    </div>
  );
}
