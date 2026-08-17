import type { SelisihStatus } from "@/app/tutup-kasir/lib/calculations";
import { formatRupiah } from "@/lib/format";

const selisihToneClasses: Record<SelisihStatus, string> = {
  MINUS  : "border-status-danger-border bg-status-danger-bg text-status-danger-fg",
  PAS    : "border-status-active-border bg-status-active-bg text-status-active-fg",
  SURPLUS: "border-status-info-border bg-status-info-bg text-status-info-fg",
};

const selisihLabels: Record<SelisihStatus, string> = {
  MINUS  : "Status Kas: Kas Kurang (Minus)",
  PAS    : "Status Kas: Uang Pas (Sesuai)",
  SURPLUS: "Status Kas: Kas Lebih (Surplus)",
};

type CashReconciliationFormProps = {
  catatan                : string;
  kasAktualInput          : string;
  onCatatanChangeAction   : (value: string) => void;
  onKasAktualChangeAction : (value: string) => void;
  onSubmitAction          : () => void;
  selisih                 : number;
  selisihStatus           : SelisihStatus;
  totalKasDiharapkan      : number;
};

export default function CashReconciliationForm({
  catatan,
  kasAktualInput,
  onCatatanChangeAction,
  onKasAktualChangeAction,
  onSubmitAction,
  selisih,
  selisihStatus,
  totalKasDiharapkan,
}: CashReconciliationFormProps) {
  const kasAktualNumber = Number(kasAktualInput.replace(/\D/g, "")) || 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
      <h3 className="text-base font-bold text-foreground">
        Penghitungan Kas Laci Fisik (Cash Count)
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Hitung uang fisik di dalam laci kasir dan bandingkan dengan catatan sistem.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
          <span className="text-sm font-semibold text-foreground">
            Kas Seharusnya di Laci:
          </span>
          <span className="text-lg font-extrabold text-foreground">
            {formatRupiah(totalKasDiharapkan)}
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="kasAktual">
            Kas Fisik Aktual di Laci (Rp)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
              Rp
            </span>
            <input
              className="w-full rounded-xl border border-border bg-background py-2.5 pr-3.5 pl-10 text-base font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              id="kasAktual"
              onChange={(e) => onKasAktualChangeAction(e.target.value.replace(/\D/g, ""))}
              type="text"
              value={kasAktualNumber ? kasAktualNumber.toLocaleString("id-ID") : ""}
            />
          </div>
        </div>

        {/* Status Selisih */}
        <div className={`flex items-center justify-between rounded-xl border p-3.5 ${selisihToneClasses[selisihStatus]}`}>
          <span className="text-xs font-bold">{selisihLabels[selisihStatus]}</span>
          <span className="text-sm font-extrabold font-mono">
            {selisih === 0 ? "Rp 0" : `${selisih > 0 ? "+" : ""}${formatRupiah(selisih)}`}
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="catatan">
            Catatan Shift (Opsional)
          </label>
          <textarea
            className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            id="catatan"
            onChange={(e) => onCatatanChangeAction(e.target.value)}
            placeholder="Tuliskan keterangan jika terdapat selisih uang atau catatan kasir..."
            rows={3}
            value={catatan}
          />
        </div>

        <div className="pt-3">
          <button
            className="w-full rounded-xl bg-status-danger-dot py-3 text-sm font-bold text-white shadow-sm transition-all hover:brightness-90 active:scale-[0.99]"
            onClick={onSubmitAction}
            type="button"
          >
            Konfirmasi & Akhiri Shift Kasir
          </button>
        </div>
      </div>
    </div>
  );
}
