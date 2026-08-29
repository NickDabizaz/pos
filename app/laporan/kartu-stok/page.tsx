"use client";

import { useEffect, useRef, useState } from "react";

import { buatUrlLaporanKartuStok, type FilterKartuStokState } from "@/lib/client/laporan/kartuStok";
import { fetchBarangList, type Barang } from "@/lib/client/barang";

const filterAwal: FilterKartuStokState = { idbarang: null };

export default function LaporanKartuStokPage() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [filter, setFilter] = useState<FilterKartuStokState>(filterAwal);
  const [src, setSrc] = useState(() => buatUrlLaporanKartuStok(filterAwal));
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchBarangList().then(setBarangList).catch(() => setBarangList([]));
  }, []);

  function handleTampilkan() {
    setSrc(buatUrlLaporanKartuStok(filter));
  }

  function handleCetak() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div className="flex h-screen flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">Laporan Kartu Stok</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Barang
          <select
            className="min-w-[220px] rounded-lg border border-border px-3 py-1.5 text-sm"
            onChange={(event) => setFilter({ idbarang: event.target.value ? Number(event.target.value) : null })}
            value={filter.idbarang ?? ""}
          >
            <option value="">Semua Barang</option>
            {barangList.map((barang) => (
              <option key={barang.idbarang} value={barang.idbarang}>
                {barang.namabarang}
              </option>
            ))}
          </select>
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

      <iframe className="w-full flex-1 rounded-lg border border-border bg-white" ref={iframeRef} src={src} title="Laporan Kartu Stok" />
    </div>
  );
}
