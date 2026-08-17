"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatRupiah } from "@/app/pos/lib/calculations";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function TutupKasirPage() {
  const router = useRouter();

  const [modalAwal]                   = useState<number>(200000);
  const [penjualanTunai]              = useState<number>(450000);
  const [penjualanNonTunai]           = useState<number>(285000);
  const [jumlahTransaksi]             = useState<number>(9);
  const [kasAktualInput, setKasInput] = useState<string>("650000");
  const [catatan, setCatatan]         = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);

  const totalKasDiharapkan = modalAwal + penjualanTunai;
  const kasAktualNumber = Number(kasAktualInput.replace(/\D/g, "")) || 0;
  const selisih = kasAktualNumber - totalKasDiharapkan;

  function handleKonfirmasiTutup() {
    setIsSuccess(true);
    setIsConfirming(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-muted-foreground shadow-2xs">
              <span className="size-1.5 rounded-full bg-status-active-dot" />
              Shift Aktif
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tutup Kasir & Rekap Shift
          </h1>
          <p className="text-sm text-muted-foreground">
            Rekapitulasi penjualan shift dan perhitungan kas akhir laci.
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-secondary"
          onClick={() => router.push("/pos")}
          type="button"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Kembali ke POS</span>
        </button>
      </div>

      {isSuccess ? (
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
              onClick={() => router.push("/pos")}
              type="button"
            >
              Kembali
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">Modal Awal</span>
              <div className="mt-2 text-lg font-extrabold text-foreground">
                {formatRupiah(modalAwal)}
              </div>
              <span className="text-[11px] text-muted-foreground">Kas buka shift</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">Penjualan Tunai</span>
              <div className="mt-2 text-lg font-extrabold text-status-active-fg">
                {formatRupiah(penjualanTunai)}
              </div>
              <span className="text-[11px] text-muted-foreground">Uang kas masuk</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">Non-Tunai (QRIS/Bank)</span>
              <div className="mt-2 text-lg font-extrabold text-status-info-fg">
                {formatRupiah(penjualanNonTunai)}
              </div>
              <span className="text-[11px] text-muted-foreground">Digital / e-Wallet</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">Total Transaksi</span>
              <div className="mt-2 text-lg font-extrabold text-foreground">
                {jumlahTransaksi} struk
              </div>
              <span className="text-[11px] text-muted-foreground">Total pesanan selesai</span>
            </div>
          </div>

          {/* Detailed Cash Reconciliation Form */}
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
                    onChange={(e) => setKasInput(e.target.value.replace(/\D/g, ""))}
                    type="text"
                    value={kasAktualNumber ? kasAktualNumber.toLocaleString("id-ID") : ""}
                  />
                </div>
              </div>

              {/* Status Selisih */}
              <div
                className={`flex items-center justify-between rounded-xl border p-3.5 ${
                  selisih === 0
                    ? "border-status-active-border bg-status-active-bg text-status-active-fg"
                    : selisih > 0
                    ? "border-status-info-border bg-status-info-bg text-status-info-fg"
                    : "border-status-danger-border bg-status-danger-bg text-status-danger-fg"
                }`}
              >
                <span className="text-xs font-bold">
                  {selisih === 0
                    ? "Status Kas: Uang Pas (Sesuai)"
                    : selisih > 0
                    ? "Status Kas: Kas Lebih (Surplus)"
                    : "Status Kas: Kas Kurang (Minus)"}
                </span>
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
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan keterangan jika terdapat selisih uang atau catatan kasir..."
                  rows={3}
                  value={catatan}
                />
              </div>

              <div className="pt-3">
                <button
                  className="w-full rounded-xl bg-status-danger-dot py-3 text-sm font-bold text-white shadow-sm transition-all hover:brightness-90 active:scale-[0.99]"
                  onClick={() => setIsConfirming(true)}
                  type="button"
                >
                  Konfirmasi & Akhiri Shift Kasir
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isConfirming && (
        <ConfirmDialog
          confirmLabel   = "Tutup Shift"
          description    = "Apakah Anda yakin ingin menutup shift kasir saat ini? Sesi akan diakhiri dan kas fisik akan direkap."
          isConfirming   = {false}
          onCancelAction = {() => setIsConfirming(false)}
          onConfirmAction= {handleKonfirmasiTutup}
          title          = "Konfirmasi Tutup Kasir"
        />
      )}
    </div>
  );
}
