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

function uraikanOrderId(orderid: string): { idperusahaan: number; kodepaket: string } | null {
  const match = ORDER_ID_PATTERN.exec(orderid);
  if (!match) {
    return null;
  }
  return { idperusahaan: Number(match[1]), kodepaket: match[2] };
}

export function listPaketLangganan(db: GlobalClient): PaketLangganan[] {
  void db;
  return PAKET_LANGGANAN;
}

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

export async function syncSnapTransaction(
  db            : GlobalClient,
  orderid       : string,
  midtransClient: MidtransClient,
): Promise<{ activated: boolean; langganan: LanggananRow | null }> {
  const payload = await midtransClient.getStatus(orderid);
  return handleMidtransNotification(db, payload);
}
