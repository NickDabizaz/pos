import { formatWaktuCetak } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLE = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 24px; }
  .header { margin-bottom: 16px; border-bottom: 2px solid #111; padding-bottom: 8px; }
  .header .perusahaan { font-size: 15px; font-weight: bold; }
  .header .judul { font-size: 18px; font-weight: bold; margin-top: 2px; }
  .header .filter { margin-top: 6px; font-size: 12px; color: #333; }
  .header .filter span { display: inline-block; margin-right: 16px; }
  .header .waktu-cetak { margin-top: 4px; font-size: 11px; color: #666; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #eee; font-weight: bold; }
  td.angka, th.angka { text-align: right; }
  .kosong { padding: 24px; text-align: center; color: #666; font-style: italic; }
  .dibatalkan { color: #b91c1c; }
  .dibatalkan .badge { display: inline-block; font-size: 10px; font-weight: bold; border: 1px solid #b91c1c; border-radius: 3px; padding: 0 4px; margin-left: 4px; }
  @media print {
    body { margin: 8mm; }
    .no-print { display: none; }
  }
`;

/** Bungkus konten `<table>` yang sudah disusun `render` tiap laporan menjadi dokumen HTML lengkap. */
export function bungkusDokumenLaporan(konteks: KonteksLaporan, kontenTabel: string): string {
  const filterHtml = konteks.keteranganFilter.map((baris) => `<span>${escapeHtml(baris)}</span>`).join("");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(konteks.judul)}</title>
<style>${STYLE}</style>
</head>
<body>
<div class="header">
  <div class="perusahaan">${escapeHtml(konteks.namaPerusahaan)}</div>
  <div class="judul">${escapeHtml(konteks.judul)}</div>
  <div class="filter">${filterHtml}</div>
  <div class="waktu-cetak">Dicetak: ${escapeHtml(formatWaktuCetak(konteks.waktuCetak))}</div>
</div>
${kontenTabel}
</body>
</html>`;
}

/** Pesan seragam untuk laporan tanpa baris data — dokumen tetap sah, bukan tabel kosong. */
export function pesanTidakAdaData(pesan = "Tidak ada data"): string {
  return `<div class="kosong">${escapeHtml(pesan)}</div>`;
}

export { escapeHtml };
