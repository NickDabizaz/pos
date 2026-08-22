import { createHash, randomBytes } from "node:crypto";

import {
  findLanggananByOrderid,
  findPerusahaanById,
  insertLanggananDanAktifkanPerusahaan,
  isKonflikOrderid,
} from "@/lib/server/subscription/repository";
import type {
  GlobalClient,
  LanggananRow,
  MidtransClient,
  MidtransNotificationPayload,
  PaketLangganan,
  SnapTransactionResult,
} from "@/lib/server/subscription/types";

export class PaketTidakDitemukanError extends Error {}
export class PerusahaanTidakDitemukanError extends Error {}
export class PerusahaanSudahAktifError extends Error {}
export class SignatureTidakValidError extends Error {}
export class OrderTidakDikenalError extends Error {}
export class JumlahTidakSesuaiError extends Error {}

/** Katalog Paket Langganan tetap — bukan tabel DB (lihat catatan asumsi tiket 09). */
export const PAKET_LANGGANAN: PaketLangganan[] = [
  { kodepaket: "bulanan", namapaket: "Paket Bulanan", hargapaket: 150_000, masaberlakuhari: 30 },
  { kodepaket: "tahunan", namapaket: "Paket Tahunan", hargapaket: 1_500_000, masaberlakuhari: 365 },
];

const ORDER_ID_PATTERN = /^LGN-(\d+)-([a-z]+)-([a-f0-9]+)$/;

function cariPaket(kodepaket: string): PaketLangganan | undefined {
  return PAKET_LANGGANAN.find((paket) => paket.kodepaket === kodepaket);
}

function buatOrderId(idperusahaan: number, kodepaket: string): string {
  return `LGN-${idperusahaan}-${kodepaket}-${randomBytes(8).toString("hex")}`;
}

/** Order_id hanya sah kalau memenuhi pola yang dibuat {@link buatOrderId} — order_id yang
 * tidak pernah dibuat lewat `createSnapTransaction` tidak akan cocok pola ini. */
function uraikanOrderId(orderid: string): { idperusahaan: number; kodepaket: string } | null {
  const match = ORDER_ID_PATTERN.exec(orderid);
  if (!match) {
    return null;
  }
  return { idperusahaan: Number(match[1]), kodepaket: match[2] };
}

/** Menampilkan katalog Paket Langganan. `db` dilewatkan eksplisit (ADR 0003) meski belum
 * dipakai — katalog bersumber dari config tetap, bukan tabel. */
export function listPaketLangganan(db: GlobalClient): PaketLangganan[] {
  void db;
  return PAKET_LANGGANAN;
}

/** Membuka pembayaran Snap sandbox untuk Perusahaan berstatus belum bayar. */
export async function createSnapTransaction(
  db          : GlobalClient,
  idperusahaan: number,
  kodepaket   : string,
  midtransClient: MidtransClient,
): Promise<SnapTransactionResult> {
  const perusahaan = await findPerusahaanById(db, idperusahaan);
  if (!perusahaan) {
    throw new PerusahaanTidakDitemukanError(`Perusahaan dengan id ${idperusahaan} tidak ditemukan`);
  }
  if (perusahaan.status !== 0) {
    throw new PerusahaanSudahAktifError("Perusahaan ini sudah aktif, tidak perlu membayar lagi");
  }

  const paket = cariPaket(kodepaket);
  if (!paket) {
    throw new PaketTidakDitemukanError(`Paket Langganan "${kodepaket}" tidak ditemukan`);
  }

  const orderid = buatOrderId(idperusahaan, kodepaket);
  const transaksi = await midtransClient.createTransaction({
    transaction_details: { order_id: orderid, gross_amount: paket.hargapaket },
  });

  return { orderid, token: transaksi.token, redirecturl: transaksi.redirect_url };
}

function hitungSignature(orderid: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return createHash("sha512").update(`${orderid}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

function tglSelesaiDari(tglmulai: Date, masaberlakuhari: number): Date {
  const hasil = new Date(tglmulai);
  hasil.setUTCDate(hasil.getUTCDate() + masaberlakuhari);
  return hasil;
}

const STATUS_LUNAS = new Set(["settlement", "capture"]);
const STATUS_DIABAIKAN = new Set(["pending"]);

/**
 * Menangani notifikasi Midtrans. Hanya `transaction_status` lunas (settlement/capture) yang
 * mengaktifkan Perusahaan; status lain (deny/expire/cancel) tidak mengubah apa pun, dan
 * pending sengaja diabaikan menunggu notifikasi status akhir berikutnya. Keabsahan notifikasi
 * cukup diverifikasi lewat signature (di bawah) — tidak perlu memanggil balik Midtrans lewat
 * `midtransClient`, jadi berbeda dari seam awal tiket 09, parameter itu sengaja tidak ada di
 * sini supaya tidak ada dependency yang tidak pernah dipakai.
 */
export async function handleMidtransNotification(
  db     : GlobalClient,
  payload: MidtransNotificationPayload,
): Promise<{ activated: boolean; langganan: LanggananRow | null }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const signatureSah = hitungSignature(payload.order_id, payload.status_code, payload.gross_amount, serverKey);
  if (signatureSah.toLowerCase() !== payload.signature_key.toLowerCase()) {
    throw new SignatureTidakValidError("Signature notifikasi Midtrans tidak valid");
  }

  const diuraikan = uraikanOrderId(payload.order_id);
  if (!diuraikan) {
    throw new OrderTidakDikenalError(`order_id "${payload.order_id}" tidak pernah dibuat lewat createSnapTransaction`);
  }

  if (STATUS_DIABAIKAN.has(payload.transaction_status)) {
    return { activated: false, langganan: null };
  }
  if (!STATUS_LUNAS.has(payload.transaction_status)) {
    return { activated: false, langganan: null };
  }

  const existing = await findLanggananByOrderid(db, payload.order_id);
  if (existing) {
    return { activated: false, langganan: existing };
  }

  const perusahaan = await findPerusahaanById(db, diuraikan.idperusahaan);
  if (!perusahaan) {
    throw new PerusahaanTidakDitemukanError(`Perusahaan dengan id ${diuraikan.idperusahaan} tidak ditemukan`);
  }

  const paket = cariPaket(diuraikan.kodepaket);
  if (!paket) {
    throw new PaketTidakDitemukanError(`Paket Langganan "${diuraikan.kodepaket}" tidak ditemukan`);
  }

  if (Number(payload.gross_amount) !== paket.hargapaket) {
    throw new JumlahTidakSesuaiError("gross_amount pada notifikasi tidak sesuai harga Paket Langganan");
  }

  const tglmulai = new Date(new Date().toISOString().slice(0, 10));
  const tglselesai = tglSelesaiDari(tglmulai, paket.masaberlakuhari);

  try {
    const langganan = await insertLanggananDanAktifkanPerusahaan(
      db,
      diuraikan.idperusahaan,
      payload.order_id,
      paket,
      tglmulai,
      tglselesai,
    );
    return { activated: true, langganan };
  } catch (error) {
    if (isKonflikOrderid(error)) {
      const langganan = await findLanggananByOrderid(db, payload.order_id);
      return { activated: false, langganan };
    }
    throw error;
  }
}

/**
 * Jalan pintas untuk mengaktifkan Langganan tanpa menunggu webhook notifikasi Midtrans —
 * berguna saat notifikasi belum bisa sampai ke aplikasi (mis. dev lokal tanpa tunnel publik,
 * lihat catatan di `.env`). Mengambil status transaksi langsung dari Midtrans lewat
 * `midtransClient.getStatus` (server-to-server, diautentikasi Server Key) lalu memakai jalur
 * `handleMidtransNotification` yang sama — bukan jalur terpisah, jadi tidak ada duplikasi
 * aturan aktivasi/dedup/validasi jumlah.
 */
export async function syncSnapTransaction(
  db            : GlobalClient,
  orderid       : string,
  midtransClient: MidtransClient,
): Promise<{ activated: boolean; langganan: LanggananRow | null }> {
  const payload = await midtransClient.getStatus(orderid);
  return handleMidtransNotification(db, payload);
}
