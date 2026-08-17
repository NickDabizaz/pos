"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import type { ShiftSession } from "@/app/pos/lib/types";
import { formatRupiah } from "@/lib/format";

type PosHeaderProps = {
  onBarcodeScanAction ?: (barcode: string) => void;
  onSearchChangeAction : (query: string) => void;
  searchRef            : React.RefObject<HTMLInputElement | null>;
  searchQuery          : string;
  session              : ShiftSession | null;
};

export default function PosHeader({
  onBarcodeScanAction,
  onSearchChangeAction,
  searchRef,
  searchQuery,
  session,
}: PosHeaderProps) {
  const router = useRouter();
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("id-ID", {
          hour  : "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim() && onBarcodeScanAction) {
      onBarcodeScanAction(searchQuery.trim());
    }
  }

  function handleTutupKasir() {
    router.push("/tutup-kasir");
  }

  return (
    <header className="border-b border-border bg-card px-4 py-3 shadow-2xs sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Kasir & Shift Info */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-bold tracking-tight text-foreground">
              {session?.kasirName ?? "Kasir"}
            </span>
          </div>

          <span className="text-xs text-muted-foreground/40">•</span>

          {session?.modalAwal !== undefined && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-2.5 py-0.5 text-xs font-semibold text-foreground">
              <span className="text-muted-foreground">Modal Awal:</span>
              <span className="text-status-active-fg">{formatRupiah(session.modalAwal)}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <span>🕒</span>
            <span className="font-mono">{timeString}</span>
          </div>
        </div>

        {/* Center: Search & Barcode Input */}
        <div className="flex-1 max-w-xl">
          <form className="relative" onSubmit={handleSearchSubmit}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                <rect height="8" rx="1" width="10" x="7" y="8" />
              </svg>
            </div>

            <input
              className="w-full rounded-xl border border-border bg-background py-2 pr-20 pl-9 text-sm text-foreground shadow-2xs transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => onSearchChangeAction(e.target.value)}
              placeholder="Cari nama barang atau scan barcode [Enter]..."
              ref={searchRef}
              type="text"
              value={searchQuery}
            />

            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <kbd className="hidden rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-2xs sm:inline-block">
                F2
              </kbd>
            </div>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-status-danger-border bg-status-danger-bg px-3 py-1.5 text-xs font-semibold text-status-danger-fg transition-all hover:bg-status-danger-border active:scale-95"
            onClick={handleTutupKasir}
            title="Arahkan ke Menu Tutup Kasir"
            type="button"
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="11" rx="2" width="18" x="3" y="11" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4M12 15v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Tutup Kasir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
