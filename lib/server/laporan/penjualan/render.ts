import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatPeriode, formatUang, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanPenjualan } from "@/lib/server/laporan/penjualan/types";

export type KonteksFilterPenjualan = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

/** Konteks header dokumen bagi Laporan Penjualan. */
export function buatKonteksLaporanPenjualan(namaPerusahaan: string, filter: KonteksFilterPenjualan, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Penjualan",
    keteranganFilter: [formatPeriode(filter.dari, filter.sampai)],
    waktuCetak,
  };
}

/** `render` murni: baris `jualdtl` flatten + konteks -> dokumen HTML lengkap. */
export function renderLaporanPenjualan(rows: BarisLaporanPenjualan[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const baris = rows
    .map((row) => {
      const kelas = row.status === "D" ? ' class="dibatalkan"' : "";
      const badge = row.status === "D" ? ' <span class="badge">DIBATALKAN</span>' : "";

      return `<tr${kelas}>
  <td>${escapeHtml(row.kodejual)}${badge}</td>
  <td>${escapeHtml(formatTanggal(row.tgltrans))}</td>
  <td>${escapeHtml(row.namalokasi)}</td>
  <td>${escapeHtml(row.namacustomer)}</td>
  <td>${escapeHtml(row.namabarang)}</td>
  <td>${escapeHtml(row.satuan)}</td>
  <td class="angka">${formatAngka(row.qty)}</td>
  <td class="angka">${formatUang(row.harga)}</td>
  <td class="angka">${formatUang(row.subtotal)}</td>
  <td class="angka">${formatUang(row.ppnBaris)}</td>
  <td class="angka">${formatUang(row.total)}</td>
  <td class="angka">${formatUang(row.diskon)}</td>
  <td class="angka">${formatUang(row.ppn)}</td>
  <td class="angka">${formatUang(row.grandtotal)}</td>
</tr>`;
    })
    .join("\n");

  const tabel = `<table>
<thead>
<tr>
  <th>Kode</th><th>Tgl</th><th>Lokasi</th><th>Customer</th>
  <th>Barang</th><th>Satuan</th><th class="angka">Qty</th><th class="angka">Harga</th>
  <th class="angka">Subtotal</th><th class="angka">PPN Baris</th>
  <th class="angka">Total</th><th class="angka">Diskon</th><th class="angka">PPN</th><th class="angka">Grandtotal</th>
</tr>
</thead>
<tbody>
${baris}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
