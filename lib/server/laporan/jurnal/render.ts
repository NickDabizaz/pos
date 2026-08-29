import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatPeriode, formatUang, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanJurnal } from "@/lib/server/laporan/jurnal/types";

export type KonteksFilterJurnal = {
  kodetrans?: string;
  dari?     : Date;
  sampai?   : Date;
};

/** `Kode: <str>` / `Kode: Semua`, `Periode: …` / `Semua Tanggal`. */
export function buatKonteksLaporanJurnal(namaPerusahaan: string, filter: KonteksFilterJurnal, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Jurnal Transaksi",
    keteranganFilter: [
      `Kode: ${filter.kodetrans ? filter.kodetrans : "Semua"}`,
      formatPeriode(filter.dari, filter.sampai),
    ],
    waktuCetak,
  };
}

/** `render` murni: baris `jurnal` + konteks -> dokumen HTML lengkap. */
export function renderLaporanJurnal(rows: BarisLaporanJurnal[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const baris = rows
    .map(
      (row) => `<tr>
  <td>${escapeHtml(row.kodetrans)}</td>
  <td>${escapeHtml(formatTanggal(row.tgltrans))}</td>
  <td>${escapeHtml(row.jenistransaksi)}</td>
  <td>${escapeHtml(row.namalokasi)}</td>
  <td class="angka">${row.urutan}</td>
  <td>${escapeHtml(row.saldo)}</td>
  <td class="angka">${formatUang(row.amount)}</td>
  <td>${escapeHtml(row.catatan)}</td>
</tr>`,
    )
    .join("\n");

  const tabel = `<table>
<thead>
<tr>
  <th>Kode</th><th>Tgl</th><th>Jenis</th><th>Lokasi</th>
  <th class="angka">Urutan</th><th>Saldo</th><th class="angka">Amount</th><th>Catatan</th>
</tr>
</thead>
<tbody>
${baris}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
