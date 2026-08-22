"use client";

import { useMemo, useState } from "react";

import { calculateChange, generateQuickCashSuggestions } from "@/app/pos/lib/calculations";
import type { PaymentMethod } from "@/app/pos/lib/types";
import { formatRupiah } from "@/lib/format";

type PaymentModalProps = {
  grandTotal      : number;
  isOpen          : boolean;
  onCancelAction  : () => void;
  onCompleteAction: (data: {
    amountPaid    : number;
    change        : number;
    paymentMethod : PaymentMethod;
  }) => void;
};

export default function PaymentModal({
  grandTotal,
  isOpen,
  onCancelAction,
  onCompleteAction,
}: PaymentModalProps) {
  const [method, setMethod]           = useState<PaymentMethod>("TUNAI");
  const [amountPaidInput, setAmount]  = useState<string>(String(grandTotal));
  const [isProcessing, setIsProcessing] = useState(false);

  const amountPaidNumber = Number(amountPaidInput.replace(/\D/g, "")) || 0;
  const change = useMemo(() => calculateChange(grandTotal, amountPaidNumber), [grandTotal, amountPaidNumber]);
  const isSufficient = method !== "TUNAI" || amountPaidNumber >= grandTotal;

  const quickSuggestions = useMemo(
    () => generateQuickCashSuggestions(grandTotal),
    [grandTotal],
  );

  if (!isOpen) return null;

  function handleQuickCash(val: number) {
    setAmount(String(val));
  }

  function handleComplete() {
    if (!isSufficient) return;

    setIsProcessing(true);
    setTimeout(() => {
      onCompleteAction({
        amountPaid   : method === "TUNAI" ? amountPaidNumber : grandTotal,
        change       : method === "TUNAI" ? change : 0,
        paymentMethod: method,
      });
      setIsProcessing(false);
    }, 200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-slate-950/5">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect height="14" rx="2" width="20" x="2" y="5" />
                <path d="M2 10h20M6 15h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground">Pembayaran Transaksi</h2>
          </div>

          <button
            aria-label="Tutup pembayaran"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={onCancelAction}
            type="button"
          >
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-border bg-secondary/50 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total yang Harus Dibayar
            </span>
            <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
              {formatRupiah(grandTotal)}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-bold transition-all ${
                  method === "TUNAI"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                onClick={() => {
                  setMethod("TUNAI");
                  setAmount(String(grandTotal));
                }}
                type="button"
              >
                <span className="text-base mb-0.5">💵</span>
                <span>Tunai (Cash)</span>
              </button>

              <button
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-bold transition-all ${
                  method === "QRIS"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                onClick={() => setMethod("QRIS")}
                type="button"
              >
                <span className="text-base mb-0.5">📱</span>
                <span>QRIS Instant</span>
              </button>

              <button
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-bold transition-all ${
                  method === "TRANSFER"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                onClick={() => setMethod("TRANSFER")}
                type="button"
              >
                <span className="text-base mb-0.5">🏦</span>
                <span>Transfer Bank</span>
              </button>
            </div>
          </div>

          {method === "TUNAI" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="amountPaid">
                  Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-border bg-background py-2.5 pr-3.5 pl-10 text-xl font-bold tracking-wide text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    id="amountPaid"
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    type="text"
                    value={amountPaidNumber ? amountPaidNumber.toLocaleString("id-ID") : ""}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {quickSuggestions.map((sug) => (
                  <button
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                      amountPaidNumber === sug
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-secondary text-secondary-foreground hover:bg-secondary-hover"
                    }`}
                    key={sug}
                    onClick={() => handleQuickCash(sug)}
                    type="button"
                  >
                    {sug === grandTotal ? `Pas (${formatRupiah(sug)})` : formatRupiah(sug)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5">
                <span className="text-xs font-semibold text-muted-foreground">Kembalian:</span>
                <span
                  className={`text-lg font-extrabold ${
                    amountPaidNumber < grandTotal
                      ? "text-status-danger-fg text-sm font-semibold"
                      : "text-status-active-fg"
                  }`}
                >
                  {amountPaidNumber < grandTotal
                    ? `Kurang ${formatRupiah(grandTotal - amountPaidNumber)}`
                    : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {method === "QRIS" && (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground">
                Pembayaran non-tunai sebesar{" "}
                <span className="font-bold text-foreground">{formatRupiah(grandTotal)}</span>{" "}
                akan dicatat sebagai transaksi <span className="font-bold text-foreground">QRIS</span>.
              </p>
            </div>
          )}

          {method === "TRANSFER" && (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground">
                Pembayaran non-tunai sebesar{" "}
                <span className="font-bold text-foreground">{formatRupiah(grandTotal)}</span>{" "}
                akan dicatat sebagai transaksi <span className="font-bold text-foreground">Transfer Bank</span>.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-4">
          <button
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={onCancelAction}
            type="button"
          >
            Batal
          </button>

          <button
            className={`rounded-xl px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all ${
              isSufficient
                ? "bg-primary hover:bg-primary-hover active:scale-[0.99]"
                : "cursor-not-allowed bg-muted-foreground/40 opacity-60"
            }`}
            disabled={!isSufficient || isProcessing}
            onClick={handleComplete}
            type="button"
          >
            {isProcessing ? "Memproses..." : "Selesaikan Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
