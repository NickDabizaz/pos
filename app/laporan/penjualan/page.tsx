"use client";

import { useRef, useState } from "react";

import { buatUrlLaporanPenjualan, type FilterPenjualanState } from "@/lib/client/laporan/penjualan";

const filterAwal: FilterPenjualanState = { dari: "", sampai: "", termasukDibatalkan: false };

export default function LaporanPenjualanPage() {
  const [filter, setFilter] = useState<FilterPenjualanState>(filterAwal);
  const [src, setSrc] = useState(() => buatUrlLaporanPenjualan(filterAwal));
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleTampilkan() {
    setSrc(buatUrlLaporanPenjualan(filter));
  }

  function handleCetak() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div className="flex h-screen flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">Laporan Penjualan</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
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
        <label className="flex items-center gap-2 pb-1.5 text-sm text-foreground">
          <input
            checked={filter.termasukDibatalkan}
            onChange={(event) => setFilter((current) => ({ ...current, termasukDibatalkan: event.target.checked }))}
            type="checkbox"
          />
          Tampilkan dibatalkan
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

      <iframe className="w-full flex-1 rounded-lg border border-border bg-white" ref={iframeRef} src={src} title="Laporan Penjualan" />
    </div>
  );
}
