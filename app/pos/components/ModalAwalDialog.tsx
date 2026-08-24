"use client";

import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/client/auth";
import { formatRupiah } from "@/lib/format";
import type { Shift } from "@/lib/server/shift/types";

type ModalAwalDialogProps = {
  closedShift        ?: Shift | null;
  errorMessage       ?: string | null;
  isOpen              : boolean;
  isSubmitting       ?: boolean;
  onCancelCloseAction : () => void;
  onCloseAction       ?: () => void;
  onSubmitAction       : (input: { modalawal: number }) => void;
};

const quickNominals = [100000, 200000, 300000, 500000, 1000000];

export default function ModalAwalDialog({
  closedShift,
  errorMessage,
  isOpen,
  isSubmitting = false,
  onCancelCloseAction,
  onCloseAction,
  onSubmitAction,
}: ModalAwalDialogProps) {
  const { data: session } = authClient.useSession();
  const [modalawal, setModalawal]   = useState<number>(200000);
  const [inputVal, setInputVal]     = useState("200000");
  const [validationError, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleNominalChange(val: string) {
    const rawNumber = Number(val.replace(/\D/g, ""));
    setInputVal(val.replace(/\D/g, ""));
    setModalawal(rawNumber);
    if (rawNumber >= 0) setError(null);
  }

  function handleQuickPreset(amount: number) {
    setModalawal(amount);
    setInputVal(String(amount));
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (modalawal < 0 || isNaN(modalawal)) {
      setError("Nominal modal awal tidak valid");
      return;
    }

    onSubmitAction({ modalawal });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl ring-1 ring-slate-950/5">
        {onCloseAction && (
          <button
            aria-label="Tutup"
            className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={onCloseAction}
            type="button"
          >
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {closedShift ? (
          <>
            <div className="mb-6 flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-status-danger-border bg-status-danger-bg text-status-danger-fg">
                <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="11" rx="2" width="18" x="3" y="11" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4M12 15v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Shift Hari Ini Sudah Ditutup
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Satu hari hanya boleh ada satu shift. Batalkan penutupan untuk melanjutkan shift
                  {" "}{closedShift.namakasir}, bukan membuka shift baru.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-status-danger-border bg-status-danger-bg p-3 text-xs font-medium text-status-danger-fg">
                {errorMessage}
              </div>
            )}

            <div className="mb-6 space-y-2 rounded-xl border border-border bg-secondary/40 p-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Kasir</span>
                <span className="font-semibold text-foreground">{closedShift.namakasir}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Modal Awal</span>
                <span className="font-semibold text-foreground">{formatRupiah(closedShift.modalawal ?? 0)}</span>
              </div>
              {closedShift.kasaktual !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kas Aktual Tercatat</span>
                  <span className="font-semibold text-foreground">{formatRupiah(closedShift.kasaktual)}</span>
                </div>
              )}
            </div>

            <button
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={onCancelCloseAction}
              type="button"
            >
              {isSubmitting ? "Membatalkan Penutupan..." : "Batal Tutup Kasir"}
            </button>
          </>
        ) : (
          <>
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
              <div className="rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kasir</span>
                <p className="mt-0.5 font-semibold text-foreground">{session?.user.name ?? "Memuat..."}</p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="modalawal">
                    Modal Awal (Rp)
                  </label>
                  {modalawal > 0 && (
                    <span className="text-xs font-semibold text-status-active-fg">
                      {formatRupiah(modalawal)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-border bg-background py-2.5 pr-3.5 pl-10 text-base font-semibold tracking-wide text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    id="modalawal"
                    onChange={(e) => handleNominalChange(e.target.value)}
                    placeholder="0"
                    type="text"
                    value={inputVal ? Number(inputVal).toLocaleString("id-ID") : ""}
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {quickNominals.map((amount) => (
                    <button
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        modalawal === amount
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
          </>
        )}
      </div>
    </div>
  );
}
