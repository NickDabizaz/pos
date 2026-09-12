import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatLokasi, formatPeriode, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { GrupLaporanKartuStok } from "@/lib/server/laporan/kartustok/types";

export type KonteksFilterKartuStok = {
  namabarang?: string | null;
  dari?      : Date;
  sampai?    : Date;
  namaLokasi?: string[] | null;
};

export function buatKonteksLaporanKartuStok(namaPerusahaan: string, filter: KonteksFilterKartuStok, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Kartu Stok",
    keteranganFilter: [
      `Barang: ${filter.namabarang ? filter.namabarang : "Semua"}`,
      formatPeriode(filter.dari, filter.sampai),
      formatLokasi(filter.namaLokasi),
    ],
    waktuCetak,
  };
}

/** `render` murni: kelompok mutasi per Barang (Saldo Awal + saldo berjalan sudah dihitung) -> dokumen HTML. */
export function renderLaporanKartuStok(grup: GrupLaporanKartuStok[], konteks: KonteksLaporan): string {
  if (grup.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const bagian = grup
    .map((barang) => {
      const saldoAwal = `<tr class="grup">
  <td colspan="6">Saldo Awal</td>
  <td class="angka">${formatAngka(barang.saldoAwal)}</td>
  <td></td>
</tr>`;

      const baris = barang.baris
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

      const saldoAkhir = `<tr class="total">
  <td colspan="6">Saldo Akhir</td>
  <td class="angka">${formatAngka(barang.saldoAkhir)}</td>
  <td></td>
</tr>`;

      return `<h3>${escapeHtml(barang.namabarang)} (${escapeHtml(barang.satuan)})</h3>
<table>
<thead>
<tr>
  <th>Tgl</th><th>Kode</th><th>Jenis</th><th>Lokasi</th>
  <th class="angka">Masuk</th><th class="angka">Keluar</th><th class="angka">Saldo</th><th>Catatan</th>
</tr>
</thead>
<tbody>
${saldoAwal}
${baris}
${saldoAkhir}
</tbody>
</table>`;
    })
    .join("\n");

  return bungkusDokumenLaporan(konteks, bagian);
}
