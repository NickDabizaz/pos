import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanPosisiStok } from "@/lib/server/laporan/posisistok/types";

export type KonteksFilterPosisiStok = {
  namabarang?: string | null;
  tanggal    : Date;
};

/** `Barang: Semua` / `Barang: <nama>`, dan `Per tanggal: <hari ini>`. */
export function buatKonteksLaporanPosisiStok(namaPerusahaan: string, filter: KonteksFilterPosisiStok, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Posisi Stok",
    keteranganFilter: [
      `Barang: ${filter.namabarang ? filter.namabarang : "Semua"}`,
      `Per tanggal: ${formatTanggal(filter.tanggal)}`,
    ],
    waktuCetak,
  };
}

/** `render` murni: baris (Barang x Lokasi) + konteks -> dokumen HTML lengkap. */
export function renderLaporanPosisiStok(rows: BarisLaporanPosisiStok[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const baris = rows
    .map(
      (row) => `<tr>
  <td>${escapeHtml(row.namabarang)}</td>
  <td>${escapeHtml(row.satuan)}</td>
  <td>${escapeHtml(row.namalokasi)}</td>
  <td class="angka">${formatAngka(row.saldo)}</td>
</tr>`,
    )
    .join("\n");

  const tabel = `<table>
<thead>
<tr>
  <th>Barang</th><th>Satuan</th><th>Lokasi</th><th class="angka">Saldo</th>
</tr>
</thead>
<tbody>
${baris}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
