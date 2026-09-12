import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatLokasi, formatPeriode, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { TransaksiLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/types";

export type KonteksFilterOpnameStok = {
  dari?      : Date;
  sampai?    : Date;
  namaLokasi?: string[] | null;
};

export function buatKonteksLaporanOpnameStok(namaPerusahaan: string, filter: KonteksFilterOpnameStok, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Opname Stok",
    keteranganFilter: [formatPeriode(filter.dari, filter.sampai), formatLokasi(filter.namaLokasi)],
    waktuCetak,
  };
}

/** `render` murni: transaksi `opnamestok` terkelompok + konteks -> dokumen HTML lengkap. */
export function renderLaporanOpnameStok(transaksi: TransaksiLaporanOpnameStok[], konteks: KonteksLaporan): string {
  if (transaksi.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  let selisihSemua = 0;

  const bagian = transaksi
    .map((trx) => {
      const kelas = trx.status === "D" ? ' class="grup dibatalkan"' : ' class="grup"';
      const badge = trx.status === "D" ? ' <span class="badge">DIBATALKAN</span>' : "";
      const sesuai = trx.jmlDisembunyikan > 0 ? ` (${trx.jmlDisembunyikan} barang sesuai disembunyikan)` : "";

      const grup = `<tr${kelas}>
  <td>${escapeHtml(trx.kodeopname)}${badge}</td>
  <td>${escapeHtml(formatTanggal(trx.tgltrans))}</td>
  <td>${escapeHtml(trx.namalokasi)}${escapeHtml(sesuai)}</td>
  <td></td>
  <td></td>
  <td></td>
</tr>`;

      const detail =
        trx.detail.length === 0
          ? ""
          : `\n${trx.detail
              .map((row) => {
                selisihSemua += row.selisih;

                return `<tr>
  <td class="detail">${escapeHtml(row.namabarang)} (${escapeHtml(row.satuan)})</td>
  <td></td>
  <td></td>
  <td class="angka">${formatAngka(row.jmlsistem)}</td>
  <td class="angka">${formatAngka(row.jmlfisik)}</td>
  <td class="angka">${formatAngka(row.selisih)}</td>
</tr>`;
              })
              .join("\n")}`;

      return `${grup}${detail}`;
    })
    .join("\n");

  const total = `<tr class="total">
  <td colspan="5">TOTAL SELISIH (${transaksi.length} transaksi)</td>
  <td class="angka">${formatAngka(selisihSemua)}</td>
</tr>`;

  const tabel = `<table>
<thead>
<tr>
  <th>Kode / Barang</th><th>Tgl</th><th>Lokasi</th>
  <th class="angka">Jml Sistem</th><th class="angka">Jml Fisik</th><th class="angka">Selisih</th>
</tr>
</thead>
<tbody>
${bagian}
${total}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
