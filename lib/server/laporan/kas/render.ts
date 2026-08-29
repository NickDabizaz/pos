import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatPeriode, formatUang, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanKas } from "@/lib/server/laporan/kas/types";

export type KonteksFilterKas = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

export function buatKonteksLaporanKas(namaPerusahaan: string, filter: KonteksFilterKas, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Kas",
    keteranganFilter: [formatPeriode(filter.dari, filter.sampai)],
    waktuCetak,
  };
}

/** `render` murni: baris `kasdtl` flatten + konteks -> dokumen HTML lengkap. */
export function renderLaporanKas(rows: BarisLaporanKas[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const baris = rows
    .map((row) => {
      const kelas = row.status === "D" ? ' class="dibatalkan"' : "";
      const badge = row.status === "D" ? ' <span class="badge">DIBATALKAN</span>' : "";

      return `<tr${kelas}>
  <td>${escapeHtml(row.kodekas)}${badge}</td>
  <td>${escapeHtml(formatTanggal(row.tgltrans))}</td>
  <td>${escapeHtml(row.namalokasi)}</td>
  <td>${row.jenis === "MASUK" ? "MASUK" : "KELUAR"}</td>
  <td>${escapeHtml(row.keterangan)}</td>
  <td class="angka">${formatUang(row.nominal)}</td>
  <td class="angka">${formatUang(row.grandtotal)}</td>
</tr>`;
    })
    .join("\n");

  const tabel = `<table>
<thead>
<tr>
  <th>Kode</th><th>Tgl</th><th>Lokasi</th><th>Jenis</th>
  <th>Keterangan</th><th class="angka">Nominal</th><th class="angka">Grandtotal</th>
</tr>
</thead>
<tbody>
${baris}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
