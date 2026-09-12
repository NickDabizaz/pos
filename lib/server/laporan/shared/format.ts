import { formatRupiah } from "@/lib/format";

/** Nilai uang: pemisah ribuan, tanpa desimal — konsisten dengan format currency layar transaksi. */
export function formatUang(amount: number): string {
  return formatRupiah(amount);
}

const angkaFormatter = new Intl.NumberFormat("id-ID");

/** Angka stok/kuantitas: pemisah ribuan, pecahan tampil apa adanya (tidak dibulatkan). */
export function formatAngka(amount: number): string {
  return angkaFormatter.format(amount);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** `dd/MM/yyyy`, lokal — tanpa pergeseran zona waktu karena dibaca dari kolom `@db.Date`. */
export function formatTanggal(tanggal: Date): string {
  return `${pad2(tanggal.getUTCDate())}/${pad2(tanggal.getUTCMonth() + 1)}/${tanggal.getUTCFullYear()}`;
}

/** `dd/MM/yyyy HH:mm` untuk waktu cetak. */
export function formatWaktuCetak(waktu: Date): string {
  return `${pad2(waktu.getDate())}/${pad2(waktu.getMonth() + 1)}/${waktu.getFullYear()} ${pad2(waktu.getHours())}:${pad2(waktu.getMinutes())}`;
}

/** `Periode: dd/MM/yyyy – dd/MM/yyyy` atau `Periode: Semua Tanggal` bila salah satu ujung kosong. */
export function formatPeriode(dari?: Date | null, sampai?: Date | null): string {
  if (!dari || !sampai) {
    return "Periode: Semua Tanggal";
  }

  return `Periode: ${formatTanggal(dari)} – ${formatTanggal(sampai)}`;
}

/** `Lokasi: Semua` bila `null`/kosong, selain itu `Lokasi: A, B`. */
export function formatLokasi(namaLokasi?: string[] | null): string {
  if (!namaLokasi || namaLokasi.length === 0) {
    return "Lokasi: Semua";
  }

  return `Lokasi: ${namaLokasi.join(", ")}`;
}
