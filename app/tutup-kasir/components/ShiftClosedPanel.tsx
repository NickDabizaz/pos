type ShiftClosedPanelProps = {
  cancelError    ?: string | null;
  isCanceling    ?: boolean;
  onBackAction    : () => void;
  onCancelAction  : () => void;
};

export default function ShiftClosedPanel({
  cancelError,
  isCanceling = false,
  onBackAction,
  onCancelAction,
}: ShiftClosedPanelProps) {
  return (
    <div className="rounded-2xl border border-status-active-border bg-status-active-bg p-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-status-active-dot text-white shadow-md">
        <svg className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-status-active-fg">
        Shift Kasir Berhasil Ditutup
      </h2>
      <p className="mt-1 text-xs text-status-active-fg/80">
        Rekap transaksi telah dicatat ke dalam laporan keuangan sistem. Satu hari hanya boleh
        satu shift — batalkan penutupan ini jika ingin melanjutkan transaksi hari ini.
      </p>

      {cancelError && (
        <p className="mx-auto mt-4 max-w-sm rounded-xl border border-status-danger-border bg-status-danger-bg px-3 py-2 text-xs font-medium text-status-danger-fg">
          {cancelError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          className="rounded-xl border border-border bg-card px-6 py-2.5 text-xs font-bold text-foreground shadow-xs transition-all hover:bg-secondary active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isCanceling}
          onClick={onCancelAction}
          type="button"
        >
          {isCanceling ? "Membatalkan..." : "Batal Tutup Kasir"}
        </button>
        <button
          className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95"
          onClick={onBackAction}
          type="button"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
