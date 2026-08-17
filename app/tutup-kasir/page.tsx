"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import CashReconciliationForm from "@/app/tutup-kasir/components/CashReconciliationForm";
import ShiftClosedPanel from "@/app/tutup-kasir/components/ShiftClosedPanel";
import ShiftSummaryCards from "@/app/tutup-kasir/components/ShiftSummaryCards";
import {
  calculateSelisih,
  calculateTotalKasDiharapkan,
  getSelisihStatus,
} from "@/app/tutup-kasir/lib/calculations";
import { useTutupKasir } from "@/app/tutup-kasir/lib/useTutupKasir";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function TutupKasirPage() {
  const router = useRouter();
  const { closeError, closeShift, closedShift, isClosing, isLoading, loadError, shift } = useTutupKasir();

  const [kasAktualInput, setKasAktualInput] = useState("0");
  const [catatan, setCatatan]               = useState("");
  const [isConfirming, setIsConfirming]     = useState(false);

  const kasAktualNumber = Number(kasAktualInput.replace(/\D/g, "")) || 0;
  const totalKasDiharapkan = shift ? calculateTotalKasDiharapkan(shift) : 0;
  const selisih = calculateSelisih(kasAktualNumber, totalKasDiharapkan);
  const selisihStatus = getSelisihStatus(selisih);

  async function handleKonfirmasiTutup() {
    await closeShift(kasAktualNumber, catatan.trim() || undefined);
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

      {closedShift ? (
        <ShiftClosedPanel onBackAction={() => router.push("/pos")} />
      ) : loadError ? (
        <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
          {loadError}
        </p>
      ) : !shift ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {isLoading ? "Memuat data shift..." : "Tidak ada shift yang sedang aktif."}
        </p>
      ) : (
        <>
          <ShiftSummaryCards shift={shift} />

          {closeError && (
            <p className="rounded-xl border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
              {closeError}
            </p>
          )}

          <CashReconciliationForm
            catatan                = {catatan}
            kasAktualInput          = {kasAktualInput}
            onCatatanChangeAction   = {setCatatan}
            onKasAktualChangeAction = {setKasAktualInput}
            onSubmitAction          = {() => setIsConfirming(true)}
            selisih                 = {selisih}
            selisihStatus           = {selisihStatus}
            totalKasDiharapkan      = {totalKasDiharapkan}
          />
        </>
      )}

      {isConfirming && (
        <ConfirmDialog
          confirmLabel   = "Tutup Shift"
          description    = "Apakah Anda yakin ingin menutup shift kasir saat ini? Sesi akan diakhiri dan kas fisik akan direkap."
          isConfirming   = {isClosing}
          onCancelAction = {() => setIsConfirming(false)}
          onConfirmAction= {handleKonfirmasiTutup}
          title          = "Konfirmasi Tutup Kasir"
        />
      )}
    </div>
  );
}
