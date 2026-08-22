"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { checkoutLangganan, listPaketLangganan, syncSubscription } from "@/lib/client/subscription";
import type { PaketLangganan } from "@/lib/server/subscription/types";

const SNAP_SRC = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

type SnapResult = { order_id: string };

declare global {
  interface Window {
    snap?: {
      pay(token: string, options: {
        onSuccess: (result: SnapResult) => void;
        onPending: (result: SnapResult) => void;
        onError  : (result: SnapResult) => void;
        onClose  : () => void;
      }): void;
    };
  }
}

type SubscriptionPageProps = {
  idperusahaan: number;
};

export default function SubscriptionPage({ idperusahaan }: SubscriptionPageProps) {
  const router = useRouter();
  const [katalog, setKatalog]           = useState<PaketLangganan[] | null>(null);
  const [processingKode, setProcessing] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    listPaketLangganan()
      .then(setKatalog)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat Paket Langganan"));
  }, []);

  async function handleSelesai(orderid: string) {
    // Webhook notifikasi (`/api/subscription/notifikasi`) tetap sumber kebenaran utama —
    // sync di sini cuma jalan pintas supaya UI langsung ter-update tanpa menunggu webhook
    // sampai (mis. dev lokal tanpa tunnel publik, lihat catatan MIDTRANS_* di .env). Kalau
    // webhook-nya sudah lebih dulu memproses, sync ini aman dipanggil ulang (idempoten).
    try {
      await syncSubscription(orderid);
    } catch {
      // Diamkan — kalau memang belum lunas di sisi Midtrans, requirePerusahaanAktif di "/"
      // akan melempar balik ke sini.
    }
    router.push("/");
    router.refresh();
  }

  async function handleBayar(kodepaket: string) {
    setError(null);
    setProcessing(kodepaket);

    try {
      const snap = await checkoutLangganan(idperusahaan, kodepaket);

      window.snap?.pay(snap.token, {
        onSuccess: () => handleSelesai(snap.orderid),
        onPending: () => handleSelesai(snap.orderid),
        onError  : () => setError("Pembayaran gagal. Coba lagi."),
        onClose  : () => setProcessing(null),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membuka pembayaran. Coba lagi.");
      setProcessing(null);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <Script src={SNAP_SRC} data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="afterInteractive" />

      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            POS Boilerplate
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Pilih Paket Langganan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aktifkan Perusahaan Anda dengan memilih salah satu paket di bawah.</p>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-center text-sm text-status-danger-fg">
            {error}
          </p>
        )}

        {!katalog ? (
          <p className="text-center text-sm text-muted-foreground">Memuat...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {katalog.map((paket) => (
              <div key={paket.kodepaket} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
                <h2 className="text-lg font-semibold text-foreground">{paket.namapaket}</h2>
                <p className="mt-2 text-2xl font-bold text-foreground">Rp{paket.hargapaket.toLocaleString("id-ID")}</p>
                <p className="mt-1 text-sm text-muted-foreground">Masa berlaku {paket.masaberlakuhari} hari</p>

                <button
                  className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={processingKode !== null}
                  onClick={() => handleBayar(paket.kodepaket)}
                  type="button"
                >
                  {processingKode === paket.kodepaket ? "Memproses..." : "Bayar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
