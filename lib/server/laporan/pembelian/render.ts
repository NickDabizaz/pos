import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatPeriode, formatUang, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanPembelian } from "@/lib/server/laporan/pembelian/types";

export type KonteksFilterPembelian = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

export function buatKonteksLaporanPembelian(namaPerusahaan: string, filter: KonteksFilterPembelian, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Pembelian",
    keteranganFilter: [formatPeriode(filter.dari, filter.sampai)],
    waktuCetak,
  };
}

/** `render` murni: baris `belidtl` flatten + konteks -> dokumen HTML lengkap. */
export function renderLaporanPembelian(rows: BarisLaporanPembelian[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const baris = rows
    .map((row) => {
      const kelas = row.status === "D" ? ' class="dibatalkan"' : "";
      const badge = row.status === "D" ? ' <span class="badge">DIBATALKAN</span>' : "";

      return `<tr${kelas}>
  <td>${escapeHtml(row.kodebeli)}${badge}</td>
  <td>${escapeHtml(formatTanggal(row.tgltrans))}</td>
  <td>${escapeHtml(row.namalokasi)}</td>
  <td>${escapeHtml(row.namasupplier)}</td>
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
  <th>Kode</th><th>Tgl</th><th>Lokasi</th><th>Supplier</th>
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
