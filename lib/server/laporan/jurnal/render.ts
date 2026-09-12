import { escapeHtml, bungkusDokumenLaporan, pesanTidakAdaData } from "@/lib/server/laporan/shared/dokumen";
import { formatLokasi, formatPeriode, formatUang, formatTanggal } from "@/lib/server/laporan/shared/format";
import type { KonteksLaporan } from "@/lib/server/laporan/shared/types";
import type { BarisLaporanJurnal } from "@/lib/server/laporan/jurnal/types";

export type KonteksFilterJurnal = {
  kodetrans?: string;
  dari?     : Date;
  sampai?   : Date;
  namaLokasi?: string[] | null;
};

export function buatKonteksLaporanJurnal(namaPerusahaan: string, filter: KonteksFilterJurnal, waktuCetak: Date): KonteksLaporan {
  return {
    namaPerusahaan,
    judul           : "Laporan Jurnal Transaksi",
    keteranganFilter: [
      `Kode: ${filter.kodetrans ? filter.kodetrans : "Semua"}`,
      formatPeriode(filter.dari, filter.sampai),
      formatLokasi(filter.namaLokasi),
    ],
    waktuCetak,
  };
}

type BlokJurnal = {
  kodetrans     : string;
  tgltrans      : Date;
  jenistransaksi: string;
  namalokasi    : string;
  baris         : BarisLaporanJurnal[];
};

function kelompokkan(rows: BarisLaporanJurnal[]): BlokJurnal[] {
  const blok: BlokJurnal[] = [];

  for (const row of rows) {
    const terakhir = blok.at(-1);
    if (terakhir && terakhir.kodetrans === row.kodetrans) {
      terakhir.baris.push(row);
      continue;
    }

    blok.push({
      kodetrans     : row.kodetrans,
      tgltrans      : row.tgltrans,
      jenistransaksi: row.jenistransaksi,
      namalokasi    : row.namalokasi,
      baris         : [row],
    });
  }

  return blok;
}

/** `render` murni: baris `jurnal` -> dokumen HTML, satu blok debet/kredit per `kodetrans`. */
export function renderLaporanJurnal(rows: BarisLaporanJurnal[], konteks: KonteksLaporan): string {
  if (rows.length === 0) {
    return bungkusDokumenLaporan(konteks, pesanTidakAdaData());
  }

  let grandDebet = 0;
  let grandKredit = 0;

  const bagian = kelompokkan(rows)
    .map((blok) => {
      let debet = 0;
      let kredit = 0;

      const baris = blok.baris
        .map((row) => {
          const isDebet = row.saldo === "DEBET";
          if (isDebet) {
            debet += row.amount;
          } else {
            kredit += row.amount;
          }

          return `<tr>
  <td>${escapeHtml(row.catatan)}</td>
  <td class="angka">${isDebet ? formatUang(row.amount) : ""}</td>
  <td class="angka">${isDebet ? "" : formatUang(row.amount)}</td>
</tr>`;
        })
        .join("\n");

      grandDebet += debet;
      grandKredit += kredit;

      const nonBalance = debet !== kredit ? ' <span class="badge-nonbalance">TIDAK BALANCE</span>' : "";
      const total = `<tr class="total">
  <td>Total${nonBalance}</td>
  <td class="angka">${formatUang(debet)}</td>
  <td class="angka">${formatUang(kredit)}</td>
</tr>`;

      return `<h3>${escapeHtml(blok.kodetrans)} · ${escapeHtml(formatTanggal(blok.tgltrans))} · ${escapeHtml(blok.namalokasi)} · ${escapeHtml(blok.jenistransaksi)}</h3>
<table class="tetap">
<colgroup><col style="width:52%" /><col style="width:24%" /><col style="width:24%" /></colgroup>
<thead>
<tr><th>Keterangan</th><th class="angka">Debet</th><th class="angka">Kredit</th></tr>
</thead>
<tbody>
${baris}
${total}
</tbody>
</table>`;
    })
    .join("\n");

  const grandNonBalance = grandDebet !== grandKredit ? ' <span class="badge-nonbalance">TIDAK BALANCE</span>' : "";
  const grand = `<table class="tetap">
<colgroup><col style="width:52%" /><col style="width:24%" /><col style="width:24%" /></colgroup>
<tbody>
<tr class="total">
  <td>GRAND TOTAL${grandNonBalance}</td>
  <td class="angka">${formatUang(grandDebet)}</td>
  <td class="angka">${formatUang(grandKredit)}</td>
</tr>
</tbody>
</table>`;

  return bungkusDokumenLaporan(konteks, `${bagian}\n${grand}`);
}
