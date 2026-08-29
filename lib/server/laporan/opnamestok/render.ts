import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatPeriode, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/types";

export type KonteksFilterOpnameStok = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

export function buatKonteksLaporanOpnameStok(namaPerusahaan: string, filter: KonteksFilterOpnameStok, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Opname Stok",
    keteranganFilter: [formatPeriode(filter.dari, filter.sampai)],
    waktuCetak,
  };
}

/** `render` murni: baris `opnamestokdtl` flatten + konteks -> dokumen HTML lengkap. */
export function renderLaporanOpnameStok(rows: BarisLaporanOpnameStok[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const baris = rows
    .map((row) => {
      const kelas = row.status === "D" ? ' class="dibatalkan"' : "";
      const badge = row.status === "D" ? ' <span class="badge">DIBATALKAN</span>' : "";

      return `<tr${kelas}>
  <td>${escapeHtml(row.kodeopname)}${badge}</td>
  <td>${escapeHtml(formatTanggal(row.tgltrans))}</td>
  <td>${escapeHtml(row.namalokasi)}</td>
  <td>${escapeHtml(row.namabarang)}</td>
  <td>${escapeHtml(row.satuan)}</td>
  <td class="angka">${formatAngka(row.jmlsistem)}</td>
  <td class="angka">${formatAngka(row.jmlfisik)}</td>
  <td class="angka">${formatAngka(row.selisih)}</td>
</tr>`;
    })
    .join("\n");

  const tabel = `<table>
<thead>
<tr>
  <th>Kode</th><th>Tgl</th><th>Lokasi</th>
  <th>Barang</th><th>Satuan</th>
  <th class="angka">Jml Sistem</th><th class="angka">Jml Fisik</th><th class="angka">Selisih</th>
</tr>
</thead>
<tbody>
${baris}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
