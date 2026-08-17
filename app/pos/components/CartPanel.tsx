"use client";

import { useState } from "react";

import { formatRupiah } from "@/lib/format";
import type { CartItem } from "@/app/pos/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

type CartPanelProps = {
  discount           : number;
  grandTotal         : number;
  items              : CartItem[];
  onClearCartAction  : () => void;
  onPayAction        : () => void;
  onRemoveItemAction : (kodebarang: string) => void;
  onSetDiscountAction: (discount: number) => void;
  onUpdateQtyAction  : (kodebarang: string, qty: number) => void;
  subtotal           : number;
  totalQty           : number;
};

export default function CartPanel({
  discount,
  grandTotal,
  items,
  onClearCartAction,
  onPayAction,
  onRemoveItemAction,
  onSetDiscountAction,
  onUpdateQtyAction,
  subtotal,
  totalQty,
}: CartPanelProps) {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card shadow-lg lg:w-96 xl:w-105">
      {/* Header Cart */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Pesanan Aktif</h2>
            <p className="text-[11px] text-muted-foreground">{totalQty} item di keranjang</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-status-danger-border hover:bg-status-danger-bg hover:text-status-danger-fg"
            onClick={() => setIsConfirmingClear(true)}
            title="Kosongkan Keranjang"
            type="button"
          >
            Kosongkan
          </button>
        )}
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40">
              <svg className="size-6 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Keranjang Masih Kosong</p>
            <p className="mt-1 max-w-50 text-xs text-muted-foreground">
              Pilih produk dari katalog atau scan barcode untuk menambahkan pesanan.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const itemTotal = item.barang.hargajual * item.qty;

              return (
                <div
                  className="group relative flex flex-col gap-2 rounded-xl border border-border bg-background p-3 shadow-2xs transition-all hover:border-border-strong"
                  key={item.barang.kodebarang}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-foreground">
                        {item.barang.namabarang}
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {formatRupiah(item.barang.hargajual)} / {item.barang.satuan}
                      </p>
                    </div>

                    <button
                      aria-label={`Hapus ${item.barang.namabarang}`}
                      className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-status-danger-bg hover:text-status-danger-fg"
                      onClick={() => onRemoveItemAction(item.barang.kodebarang)}
                      type="button"
                    >
                      <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-2">
                    {/* Quantity Stepper & Direct Number Input */}
                    <div className="flex items-center rounded-lg border border-border bg-card shadow-2xs">
                      <button
                        aria-label="Kurangi jumlah"
                        className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
                        onClick={() => onUpdateQtyAction(item.barang.kodebarang, item.qty - 1)}
                        type="button"
                      >
                        <svg className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 12H4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {/* Direct Number Input */}
                      <input
                        aria-label="Kuantitas item"
                        className="w-11 border-x border-border bg-transparent py-0.5 text-center text-xs font-bold text-foreground focus:bg-background focus:outline-none"
                        min={1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            onUpdateQtyAction(item.barang.kodebarang, val);
                          }
                        }}
                        type="number"
                        value={item.qty}
                      />

                      <button
                        aria-label="Tambah jumlah"
                        className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
                        onClick={() => onUpdateQtyAction(item.barang.kodebarang, item.qty + 1)}
                        type="button"
                      >
                        <svg className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {/* Subtotal line */}
                    <span className="text-xs font-bold tracking-tight text-foreground">
                      {formatRupiah(itemTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill Breakdown & Checkout Footer */}
      <div className="border-t border-border bg-card p-4 space-y-3 shadow-sm">
        {/* Discount toggle button */}
        <div className="flex items-center justify-between">
          <button
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            onClick={() => setShowDiscountInput(!showDiscountInput)}
            type="button"
          >
            <span>🏷️</span>
            <span>{discount > 0 ? `Diskon: ${formatRupiah(discount)}` : "+ Tambah Diskon"}</span>
          </button>

          {discount > 0 && (
            <button
              className="text-[11px] font-semibold text-status-danger-fg hover:underline"
              onClick={() => onSetDiscountAction(0)}
              type="button"
            >
              Hapus Diskon
            </button>
          )}
        </div>

        {showDiscountInput && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
            <span className="text-xs font-bold text-muted-foreground">Rp</span>
            <input
              autoFocus
              className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none"
              onChange={(e) => {
                const val = Number(e.target.value.replace(/\D/g, ""));
                onSetDiscountAction(val);
              }}
              placeholder="Nominal diskon..."
              type="text"
              value={discount ? discount.toLocaleString("id-ID") : ""}
            />
          </div>
        )}

        {/* Calculation Rows */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-semibold text-foreground">{formatRupiah(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-status-active-fg">
              <span>Diskon</span>
              <span className="font-semibold">-{formatRupiah(discount)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-border/80 pt-2 text-sm font-bold text-foreground">
            <span>Total Tagihan</span>
            <span className="text-base font-extrabold text-foreground">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>

        {/* Big Checkout CTA Button */}
        <button
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all ${
            items.length > 0
              ? "bg-primary hover:bg-primary-hover active:scale-[0.99]"
              : "cursor-not-allowed bg-muted-foreground/30 opacity-60"
          }`}
          disabled={items.length === 0}
          onClick={onPayAction}
          type="button"
        >
          <div className="flex items-center gap-2">
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="14" rx="2" width="20" x="2" y="5" />
              <path d="M2 10h20M6 15h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Bayar Pesanan</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{formatRupiah(grandTotal)}</span>
            <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:inline-block">
              F4
            </kbd>
          </div>
        </button>
      </div>

      {isConfirmingClear && (
        <ConfirmDialog
          confirmLabel   = "Kosongkan"
          description    = "Semua barang di keranjang aktif akan dihapus. Lanjutkan?"
          isConfirming   = {false}
          onCancelAction = {() => setIsConfirmingClear(false)}
          onConfirmAction= {() => {
            onClearCartAction();
            setIsConfirmingClear(false);
          }}
          title          = "Kosongkan Keranjang"
        />
      )}
    </aside>
  );
}
