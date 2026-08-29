import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { GrupLaporanKartuStok } from "@/lib/server/laporan/kartustok/types";

export type KonteksFilterKartuStok = {
  namabarang?: string | null;
};

/** `Barang: Semua` bila tanpa filter, `Barang: <nama>` bila difilter satu Barang. */
export function buatKonteksLaporanKartuStok(namaPerusahaan: string, filter: KonteksFilterKartuStok, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Kartu Stok",
    keteranganFilter: [`Barang: ${filter.namabarang ? filter.namabarang : "Semua"}`],
    waktuCetak,
  };
}

/** `render` murni: kelompok mutasi per Barang (saldo berjalan sudah dihitung) + konteks -> dokumen HTML. */
export function renderLaporanKartuStok(grup: GrupLaporanKartuStok[], konteks: KonteksLaporan): string {
  if (grup.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const bagian = grup
    .map((barang) => {
      const baris =
        barang.baris.length === 0
          ? `<tr><td colspan="7" class="kosong">Tidak ada pergerakan</td></tr>`
          : barang.baris
              .map(
                (row) => `<tr>
  <td>${escapeHtml(formatTanggal(row.tgltrans))}</td>
  <td>${escapeHtml(row.kodetrans)}</td>
  <td>${escapeHtml(row.jenistransaksi)}</td>
  <td>${escapeHtml(row.namalokasi)}</td>
  <td class="angka">${row.masuk !== null ? formatAngka(row.masuk) : ""}</td>
  <td class="angka">${row.keluar !== null ? formatAngka(row.keluar) : ""}</td>
  <td class="angka">${formatAngka(row.saldoBerjalan)}</td>
  <td>${escapeHtml(row.catatan)}</td>
</tr>`,
              )
              .join("\n");

      return `<h3>${escapeHtml(barang.namabarang)} (${escapeHtml(barang.satuan)})</h3>
<table>
<thead>
<tr>
  <th>Tgl</th><th>Kode</th><th>Jenis</th><th>Lokasi</th>
  <th class="angka">Masuk</th><th class="angka">Keluar</th><th class="angka">Saldo</th><th>Catatan</th>
</tr>
</thead>
<tbody>
${baris}
</tbody>
</table>`;
    })
    .join("\n");

  return bungkusDokumenLaporan(konteks, bagian);
}
