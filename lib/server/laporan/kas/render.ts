import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatLokasi, formatPeriode, formatUang, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { TransaksiLaporanKas } from "@/lib/server/laporan/kas/types";

export type KonteksFilterKas = {
  dari?      : Date;
  sampai?    : Date;
  namaLokasi?: string[] | null;
};

export function buatKonteksLaporanKas(namaPerusahaan: string, filter: KonteksFilterKas, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Kas",
    keteranganFilter: [formatPeriode(filter.dari, filter.sampai), formatLokasi(filter.namaLokasi)],
    waktuCetak,
  };
}

/** `render` murni: transaksi `kas` terkelompok + konteks -> dokumen HTML lengkap. */
export function renderLaporanKas(transaksi: TransaksiLaporanKas[], konteks: KonteksLaporan): string {
  if (transaksi.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  let masukSemua = 0;
  let keluarSemua = 0;

  const bagian = transaksi
    .map((trx) => {
      if (trx.jenis === "MASUK") {
        masukSemua += trx.grandtotal;
      } else {
        keluarSemua += trx.grandtotal;
      }

      const kelas = trx.status === "D" ? ' class="grup dibatalkan"' : ' class="grup"';
      const badge = trx.status === "D" ? ' <span class="badge">DIBATALKAN</span>' : "";

      const grup = `<tr${kelas}>
  <td>${escapeHtml(trx.kodekas)}${badge}</td>
  <td>${escapeHtml(formatTanggal(trx.tgltrans))}</td>
  <td>${escapeHtml(trx.namalokasi)}</td>
  <td>${trx.jenis === "MASUK" ? "MASUK" : "KELUAR"}</td>
  <td></td>
  <td class="angka">${formatUang(trx.grandtotal)}</td>
</tr>`;

      const detail = trx.detail
        .map(
          (row) => `<tr>
  <td class="detail">${escapeHtml(row.keterangan)}</td>
  <td></td>
  <td></td>
  <td></td>
  <td class="angka">${formatUang(row.nominal)}</td>
  <td></td>
</tr>`,
        )
        .join("\n");

      return `${grup}\n${detail}`;
    })
    .join("\n");

  const total = `<tr class="total">
  <td colspan="4">TOTAL (${transaksi.length} transaksi). Masuk ${formatUang(masukSemua)}, Keluar ${formatUang(keluarSemua)}</td>
  <td></td>
  <td class="angka">${formatUang(masukSemua - keluarSemua)}</td>
</tr>`;

  const tabel = `<table>
<thead>
<tr>
  <th>Kode / Keterangan</th><th>Tgl</th><th>Lokasi</th><th>Jenis</th>
  <th class="angka">Nominal</th><th class="angka">Grandtotal</th>
</tr>
</thead>
<tbody>
${bagian}
${total}
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, tabel);
}
