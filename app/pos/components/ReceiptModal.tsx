"use client";

import type { TransactionSummary } from "@/app/pos/lib/types";
import { formatRupiah } from "@/lib/format";

type ReceiptModalProps = {
  isOpen          : boolean;
  onNewOrderAction: () => void;
  transaction     : TransactionSummary | null;
};

export default function ReceiptModal({
  isOpen,
  onNewOrderAction,
  transaction,
}: ReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  function handlePrint() {
    window.print();
  }

  const dateString = transaction.date.toLocaleString("id-ID", {
    day   : "2-digit",
    hour  : "2-digit",
    minute: "2-digit",
    month : "short",
    second: "2-digit",
    year  : "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-slate-950/5">
        {/* Receipt Paper Simulation */}
        <div className="bg-[#ffffff] p-6 text-slate-900 font-mono text-xs shadow-inner">
          {/* Header */}
          <div className="text-center space-y-1">
            <h3 className="text-base font-extrabold tracking-wider uppercase font-sans">
              KASIR POS RETAIL
            </h3>
            <p className="text-[11px] text-slate-500">Jl. Jenderal Sudirman No. 123</p>
            <p className="text-[11px] text-slate-500">Telp: (021) 555-0199</p>
          </div>

          <div className="my-3 border-b border-dashed border-slate-300" />

          {/* Metadata */}
          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>No. Inv:</span>
              <span className="font-bold text-slate-800">{transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{dateString}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.kasirName}</span>
            </div>
          </div>

          <div className="my-3 border-b border-dashed border-slate-300" />

          {/* Items */}
          <div className="space-y-2">
            {transaction.items.map((item) => (
              <div key={item.barang.kodebarang}>
                <div className="font-bold text-slate-800">{item.barang.namabarang}</div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>
                    {item.qty} x {formatRupiah(item.barang.hargajual)}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(item.qty * item.barang.hargajual)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-3 border-b border-dashed border-slate-300" />

          {/* Totals */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>

            {transaction.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(transaction.discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-dashed border-slate-300 pt-1.5 mt-1.5">
              <span>TOTAL:</span>
              <span>{formatRupiah(transaction.grandTotal)}</span>
            </div>

            <div className="flex justify-between text-slate-600 pt-1">
              <span>Metode:</span>
              <span className="font-bold uppercase">{transaction.paymentMethod}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Bayar:</span>
              <span>{formatRupiah(transaction.amountPaid)}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-800">
              <span>Kembalian:</span>
              <span>{formatRupiah(transaction.change)}</span>
            </div>
          </div>

          <div className="my-3 border-b border-dashed border-slate-300" />

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 space-y-0.5">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-2 border-t border-border bg-card p-4">
          <button
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary-hover"
            onClick={handlePrint}
            type="button"
          >
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Cetak Struk</span>
          </button>

          <button
            className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-95"
            onClick={onNewOrderAction}
            type="button"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
