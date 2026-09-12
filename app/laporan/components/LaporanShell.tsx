"use client";

import type { ReactNode } from "react";

import { useLaporanView } from "@/app/laporan/components/useLaporanView";

type Props = {
  judul  : string;
  buatUrl: () => string;
  children: ReactNode;
};

/** Kerangka halaman laporan: judul, panel filter, tombol Tampilkan/Cetak, dan iframe (kosong sampai Tampilkan). */
export default function LaporanShell({ judul, buatUrl, children }: Props) {
  const { src, sudahTampil, handleTampilkan, handleCetak, iframeRef } = useLaporanView(buatUrl);

  return (
    <div className="flex h-screen flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{judul}</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        {children}

        <div className="ml-auto flex gap-2">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={handleTampilkan}
            type="button"
          >
            Tampilkan
          </button>
          <button
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!sudahTampil}
            onClick={handleCetak}
            type="button"
          >
            Cetak
          </button>
        </div>
      </div>

      {sudahTampil && src ? (
        <iframe className="w-full flex-1 rounded-lg border border-border bg-white" ref={iframeRef} src={src} title={judul} />
      ) : (
        <div className="flex w-full flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
          Atur filter lalu klik Tampilkan untuk memuat laporan.
        </div>
      )}
    </div>
  );
}
