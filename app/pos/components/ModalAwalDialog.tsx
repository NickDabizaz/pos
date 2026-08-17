"use client";

import { type FormEvent, useState } from "react";

import type { OpenShiftInput } from "@/lib/server/shift/types";
import { formatRupiah } from "@/lib/format";

type ModalAwalDialogProps = {
  errorMessage  ?: string | null;
  isOpen         : boolean;
  isSubmitting  ?: boolean;
  onSubmitAction : (input: OpenShiftInput) => void;
};

const quickNominals = [100000, 200000, 300000, 500000, 1000000];

export default function ModalAwalDialog({
  errorMessage,
  isOpen,
  isSubmitting = false,
  onSubmitAction,
}: ModalAwalDialogProps) {
  const [kasirName, setKasirName]   = useState("Kasir 1");
  const [modalAwal, setModalAwal]   = useState<number>(200000);
  const [inputVal, setInputVal]     = useState("200000");
  const [validationError, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleNominalChange(val: string) {
    const rawNumber = Number(val.replace(/\D/g, ""));
    setInputVal(val.replace(/\D/g, ""));
    setModalAwal(rawNumber);
    if (rawNumber > 0) setError(null);
  }

  function handleQuickPreset(amount: number) {
    setModalAwal(amount);
    setInputVal(String(amount));
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!kasirName.trim()) {
      setError("Silakan isi nama kasir");
      return;
    }
    if (modalAwal < 0 || isNaN(modalAwal)) {
      setError("Nominal modal awal tidak valid");
      return;
    }

    onSubmitAction({
      kasirName: kasirName.trim(),
      modalAwal: modalAwal,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl ring-1 ring-slate-950/5">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-status-active-border bg-status-active-bg text-status-active-fg">
            <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="12" rx="2" width="20" x="2" y="6" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Buka Shift Kasir
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Masukkan modal uang kembalian awal di laci kasir sebelum memulai transaksi penjualan.
            </p>
          </div>
        </div>

        {(validationError || errorMessage) && (
          <div className="mb-4 rounded-xl border border-status-danger-border bg-status-danger-bg p-3 text-xs font-medium text-status-danger-fg">
            {validationError ?? errorMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="kasirName">
              Nama / ID Kasir
            </label>
            <input
              autoFocus
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              id="kasirName"
              onChange={(e) => {
                setKasirName(e.target.value);
                if (e.target.value.trim()) setError(null);
              }}
              placeholder="Contoh: Kasir 1 / Budi"
              type="text"
              value={kasirName}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="modalAwal">
                Modal Awal (Rp)
              </label>
              {modalAwal > 0 && (
                <span className="text-xs font-semibold text-status-active-fg">
                  {formatRupiah(modalAwal)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
                Rp
              </span>
              <input
                className="w-full rounded-xl border border-border bg-background py-2.5 pr-3.5 pl-10 text-base font-semibold tracking-wide text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                id="modalAwal"
                onChange={(e) => handleNominalChange(e.target.value)}
                placeholder="0"
                type="text"
                value={inputVal ? Number(inputVal).toLocaleString("id-ID") : ""}
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {quickNominals.map((amount) => (
                <button
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                    modalAwal === amount
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-secondary/60 text-secondary-foreground hover:bg-secondary"
                  }`}
                  key={amount}
                  onClick={() => handleQuickPreset(amount)}
                  type="button"
                >
                  {formatRupiah(amount)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Membuka Shift..." : "Mulai Shift Kasir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
