import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatAngka, formatLokasi, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanPosisiStok } from "@/lib/server/laporan/posisistok/types";

export type KonteksFilterPosisiStok = {
  namabarang?: string | null;
  tanggal    : Date;
  namaLokasi?: string[] | null;
};

export function buatKonteksLaporanPosisiStok(namaPerusahaan: string, filter: KonteksFilterPosisiStok, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Posisi Stok",
    keteranganFilter: [
      `Barang: ${filter.namabarang ? filter.namabarang : "Semua"}`,
      `Per tanggal: ${formatTanggal(filter.tanggal)}`,
      formatLokasi(filter.namaLokasi),
    ],
    waktuCetak,
  };
}

/** `render` murni: baris (Barang x Lokasi) -> dokumen HTML, dikelompokkan per Lokasi. */
export function renderLaporanPosisiStok(rows: BarisLaporanPosisiStok[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  const perLokasi = new Map<string, BarisLaporanPosisiStok[]>();
  for (const row of rows) {
    const arr = perLokasi.get(row.namalokasi) ?? [];
    arr.push(row);
    perLokasi.set(row.namalokasi, arr);
  }

  const bagian = [...perLokasi.entries()]
    .map(([namalokasi, barisLokasi]) => {
      const baris = barisLokasi
        .map(
          (row) => `<tr>
  <td>${escapeHtml(row.namabarang)}</td>
  <td>${escapeHtml(row.satuan)}</td>
  <td class="angka">${formatAngka(row.saldo)}</td>
</tr>`,
        )
        .join("\n");

      return `<h3>${escapeHtml(namalokasi)}</h3>
<table>
<thead>
<tr><th>Barang</th><th>Satuan</th><th class="angka">Saldo</th></tr>
</thead>
<tbody>
${baris}
</tbody>
</table>`;
    })
    .join("\n");

  return bungkusDokumenLaporan(konteks, bagian);
}
