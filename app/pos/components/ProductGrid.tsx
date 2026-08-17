"use client";

import { useMemo } from "react";

import ProductCard from "@/app/pos/components/ProductCard";
import type { Barang } from "@/app/pos/lib/types";
import { matchesSearch } from "@/lib/textSearch";

type ProductGridProps = {
  isLoading      : boolean;
  onSelectAction : (barang: Barang) => void;
  products       : Barang[];
  searchQuery    : string;
};

export default function ProductGrid({
  isLoading,
  onSelectAction,
  products,
  searchQuery,
}: ProductGridProps) {
  // Filter items by search query (name or kode)
  const filteredProducts = useMemo(
    () => products.filter((p) => matchesSearch([p.namabarang, p.kodebarang], searchQuery)),
    [products, searchQuery],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Grid Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                className="flex h-44 animate-pulse flex-col justify-between rounded-2xl border border-border bg-card/80 p-4"
                key={i}
              >
                <div className="aspect-4/3 w-full rounded-xl bg-secondary" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-secondary" />
                  <div className="h-4 w-1/2 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map((barang) => (
              <ProductCard
                barang         = {barang}
                key            = {barang.kodebarang}
                onSelectAction = {onSelectAction}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-xs">
              <svg className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">
              Tidak ada produk ditemukan
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {searchQuery
                ? `Tidak ada barang yang cocok dengan kata kunci "${searchQuery}"`
                : "Belum ada item barang yang tersedia dalam sistem."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
