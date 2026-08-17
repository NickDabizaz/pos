import type { Shift } from "@/app/tutup-kasir/lib/types";
import { formatRupiah } from "@/lib/format";

type ShiftSummaryCardsProps = {
  shift : Shift;
};

export default function ShiftSummaryCards({ shift }: ShiftSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
        <span className="text-xs font-semibold text-muted-foreground">Modal Awal</span>
        <div className="mt-2 text-lg font-extrabold text-foreground">
          {formatRupiah(shift.modalAwal)}
        </div>
        <span className="text-[11px] text-muted-foreground">Kas buka shift</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
        <span className="text-xs font-semibold text-muted-foreground">Penjualan Tunai</span>
        <div className="mt-2 text-lg font-extrabold text-status-active-fg">
          {formatRupiah(shift.penjualanTunai)}
        </div>
        <span className="text-[11px] text-muted-foreground">Uang kas masuk</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
        <span className="text-xs font-semibold text-muted-foreground">Non-Tunai (QRIS/Bank)</span>
        <div className="mt-2 text-lg font-extrabold text-status-info-fg">
          {formatRupiah(shift.penjualanNonTunai)}
        </div>
        <span className="text-[11px] text-muted-foreground">Digital / e-Wallet</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
        <span className="text-xs font-semibold text-muted-foreground">Total Transaksi</span>
        <div className="mt-2 text-lg font-extrabold text-foreground">
          {shift.jumlahTransaksi} struk
        </div>
        <span className="text-[11px] text-muted-foreground">Total pesanan selesai</span>
      </div>
    </div>
  );
}
