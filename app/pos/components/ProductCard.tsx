"use client";

import { type ReactElement, useState } from "react";

import { formatRupiah } from "@/lib/format";
import type { Barang } from "@/app/pos/lib/types";

type ProductCardProps = {
  barang        : Barang;
  onSelectAction: (barang: Barang) => void;
};

// Returns category-themed visual illustration & background for realistic POS cards
function getProductArtwork(name: string): { bg: string; icon: ReactElement } {
  const lower = name.toLowerCase();

  // Beras / Padi / Karung
  if (lower.includes("beras") || lower.includes("padi") || lower.includes("rice")) {
    return {
      bg  : "from-amber-50 to-orange-100/70 dark:from-amber-950/20 dark:to-orange-900/30",
      icon: (
        <svg className="size-12 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 3v18m0-18c-3 0-6 4-6 9 0 6 6 9 6 9m0-18c3 0 6 4 6 9 0 6-6 9-6 9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 12h12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    };
  }

  // Minuman / Teh / Jus / Botol
  if (lower.includes("teh") || lower.includes("minum") || lower.includes("jus") || lower.includes("soda") || lower.includes("botol")) {
    return {
      bg  : "from-emerald-50 to-teal-100/70 dark:from-emerald-950/20 dark:to-teal-900/30",
      icon: (
        <svg className="size-12 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M7 8h10M8 8V4h8v4M6 11v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 15h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    };
  }

  // Kopi / Coffee
  if (lower.includes("kopi") || lower.includes("coffee") || lower.includes("sachet")) {
    return {
      bg  : "from-amber-100/60 to-stone-200/80 dark:from-amber-950/30 dark:to-stone-900/40",
      icon: (
        <svg className="size-12 text-amber-800" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 2v2M10 2v2M14 2v2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    };
  }

  // Minyak Goreng / Minyak
  if (lower.includes("minyak") || lower.includes("oil")) {
    return {
      bg  : "from-yellow-50 to-amber-100/70 dark:from-yellow-950/20 dark:to-amber-900/30",
      icon: (
        <svg className="size-12 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M10 2h4M11 2v4a3 3 0 0 0-3 3v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9a3 3 0 0 0-3-3V2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      ),
    };
  }

  // Gula Pasir / Gula / Garam
  if (lower.includes("gula") || lower.includes("sugar") || lower.includes("garam") || lower.includes("tepung")) {
    return {
      bg  : "from-sky-50 to-blue-100/70 dark:from-sky-950/20 dark:to-blue-900/30",
      icon: (
        <svg className="size-12 text-sky-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    };
  }

  // Buku / Kertas
  if (lower.includes("buku") || lower.includes("book") || lower.includes("tulis") || lower.includes("lembar")) {
    return {
      bg  : "from-indigo-50 to-violet-100/70 dark:from-indigo-950/20 dark:to-violet-900/30",
      icon: (
        <svg className="size-12 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6h10M6 10h10M6 14h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    };
  }

  // Pulpen / Pensil / Alat Tulis
  if (lower.includes("pulpen") || lower.includes("pen") || lower.includes("pensil") || lower.includes("atk")) {
    return {
      bg  : "from-purple-50 to-fuchsia-100/70 dark:from-purple-950/20 dark:to-fuchsia-900/30",
      icon: (
        <svg className="size-12 text-purple-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 19l7-7 3 3-7 7-3-3z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 2l7.586 7.586" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    };
  }

  // Sabun / Kebersihan / Cuci
  if (lower.includes("sabun") || lower.includes("cuci") || lower.includes("clean") || lower.includes("shampo")) {
    return {
      bg  : "from-rose-50 to-pink-100/70 dark:from-rose-950/20 dark:to-pink-900/30",
      icon: (
        <svg className="size-12 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      ),
    };
  }

  // Default Package Box
  return {
    bg  : "from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/40",
    icon: (
      <svg className="size-12 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };
}

export default function ProductCard({ barang, onSelectAction }: ProductCardProps) {
  const [isClicked, setIsClicked] = useState(false);
  const artwork = getProductArtwork(barang.namabarang);
  const isAvailable = barang.status === 1;

  function handleClick() {
    if (!isAvailable) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    onSelectAction(barang);
  }

  return (
    <button
      aria-label={`Tambah ${barang.namabarang} ke keranjang`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3 text-left shadow-2xs transition-all duration-150 select-none ${
        isAvailable
          ? "border-border hover:-translate-y-1 hover:border-border-strong hover:shadow-md active:translate-y-0"
          : "cursor-not-allowed border-border/60 bg-card/60 opacity-60"
      } ${isClicked ? "scale-95 ring-2 ring-primary" : ""}`}
      disabled={!isAvailable}
      onClick={handleClick}
      type="button"
    >
      {/* 1. Gambar / Visual Box */}
      <div
        className={`relative flex aspect-4/3 w-full items-center justify-center rounded-xl bg-linear-to-br border border-border/40 shadow-inner transition-transform group-hover:scale-[1.02] ${artwork.bg}`}
      >
        {artwork.icon}

        {/* Satuan Badge pill di pojok atas gambar */}
        {barang.satuan && (
          <span className="absolute top-2 right-2 rounded-md border border-border/70 bg-card/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-2xs backdrop-blur-xs">
            {barang.satuan}
          </span>
        )}
      </div>

      {/* 2. Nama Barang */}
      <div className="mt-3 flex-1">
        <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {barang.namabarang}
        </h3>
      </div>

      {/* 3. Harga & Satuan */}
      <div className="mt-3 flex items-baseline justify-between border-t border-border/50 pt-2.5">
        <span className="text-sm font-extrabold tracking-tight text-foreground">
          {formatRupiah(barang.hargajual)}
        </span>
      </div>
    </button>
  );
}
