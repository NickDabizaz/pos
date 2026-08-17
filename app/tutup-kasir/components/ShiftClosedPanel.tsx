type ShiftClosedPanelProps = {
  onBackAction : () => void;
};

export default function ShiftClosedPanel({ onBackAction }: ShiftClosedPanelProps) {
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
        Rekap transaksi telah dicatat ke dalam laporan keuangan sistem.
      </p>
      <div className="mt-6 flex justify-center">
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
