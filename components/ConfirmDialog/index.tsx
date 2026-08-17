"use client";

import { useState } from "react";

import type { ConfirmDialogProps } from "@/components/ConfirmDialog/lib/types";

export type { ConfirmDialogProps } from "@/components/ConfirmDialog/lib/types";

const toneButtonClasses = {
  danger : "bg-status-danger-dot text-white hover:brightness-90",
  neutral: "bg-primary text-primary-foreground hover:bg-primary-hover",
};

export default function ConfirmDialog({
  alasan       = false,
  cancelLabel  = "Batal",
  confirmLabel = "Konfirmasi",
  description,
  isConfirming = false,
  onCancelAction,
  onConfirmAction,
  title,
  tone         = "danger",
}: ConfirmDialogProps) {
  const [alasanValue, setAlasanValue] = useState("");
  const isConfirmDisabled = isConfirming || (alasan && alasanValue.trim() === "");

  function handleConfirm() {
    onConfirmAction(alasan ? alasanValue.trim() : undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        {alasan && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="confirm-dialog-alasan">
              Alasan
            </label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              id="confirm-dialog-alasan"
              onChange={(event) => setAlasanValue(event.target.value)}
              rows={3}
              value={alasanValue}
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isConfirming}
            onClick={onCancelAction}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${toneButtonClasses[tone]}`}
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
            type="button"
          >
            {isConfirming ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
