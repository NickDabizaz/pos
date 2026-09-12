import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatLokasi, formatPeriode, formatUang, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { TransaksiLaporanPembelian } from "@/lib/server/laporan/pembelian/types";

export type KonteksFilterPembelian = {
  dari?      : Date;
  sampai?    : Date;
  namaLokasi?: string[] | null;
};

export function buatKonteksLaporanPembelian(namaPerusahaan: string, filter: KonteksFilterPembelian, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Pembelian",
    keteranganFilter: [formatPeriode(filter.dari, filter.sampai), formatLokasi(filter.namaLokasi)],
    waktuCetak,
  };
}

/** `render` murni: transaksi `beli` terkelompok + konteks -> dokumen HTML lengkap. */
export function renderLaporanPembelian(transaksi: TransaksiLaporanPembelian[], konteks: KonteksLaporan): string {
  if (transaksi.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  let totalSemua = 0;
  let diskonSemua = 0;
  let ppnSemua = 0;
  let grandtotalSemua = 0;

  const bagian = transaksi
    .map((trx) => {
      totalSemua += trx.total;
      diskonSemua += trx.diskon;
      ppnSemua += trx.ppn;
      grandtotalSemua += trx.grandtotal;

      const kelas = trx.status === "D" ? ' class="grup dibatalkan"' : ' class="grup"';
      const badge = trx.status === "D" ? ' <span class="badge">DIBATALKAN</span>' : "";

      const grup = `<tr${kelas}>
  <td>${escapeHtml(trx.kodebeli)}${badge}</td>
  <td>${escapeHtml(formatTanggal(trx.tgltrans))}</td>
  <td>${escapeHtml(trx.namalokasi)}</td>
  <td>${escapeHtml(trx.namasupplier)}</td>
  <td></td>
  <td></td>
  <td class="angka">${formatUang(trx.total)}</td>
  <td class="angka">${formatUang(trx.diskon)}</td>
  <td class="angka">${formatUang(trx.ppn)}</td>
  <td class="angka">${formatUang(trx.grandtotal)}</td>
</tr>`;

      const detail = trx.detail
        .map(
          (row) => `<tr>
  <td class="detail">${escapeHtml(row.namabarang)} (${escapeHtml(row.satuan)})</td>
  <td></td>
  <td></td>
  <td></td>
  <td class="angka">${formatAngka(row.qty)}</td>
  <td class="angka">${formatUang(row.harga)}</td>
  <td class="angka">${formatUang(row.subtotal)}</td>
  <td></td>
  <td class="angka">${formatUang(row.ppnBaris)}</td>
  <td></td>
</tr>`,
        )
        .join("\n");

      return `${grup}\n${detail}`;
    })
    .join("\n");

  const total = `<tr class="total">
  <td colspan="6">TOTAL (${transaksi.length} transaksi)</td>
  <td class="angka">${formatUang(totalSemua)}</td>
  <td class="angka">${formatUang(diskonSemua)}</td>
  <td class="angka">${formatUang(ppnSemua)}</td>
  <td class="angka">${formatUang(grandtotalSemua)}</td>
</tr>`;

  const tabel = `<table>
<thead>
<tr>
  <th>Kode / Barang</th><th>Tgl</th><th>Lokasi</th><th>Supplier</th>
  <th class="angka">Qty</th><th class="angka">Harga</th>
  <th class="angka">Subtotal</th><th class="angka">Diskon</th><th class="angka">PPN</th><th class="angka">Grandtotal</th>
</tr>
</thead>
<tbody>
${bagian}
${total}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
