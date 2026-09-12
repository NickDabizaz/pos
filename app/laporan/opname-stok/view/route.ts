import { NextResponse } from "next/server";

import { buatKonteksLaporanOpnameStok, renderLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/render";
import { findBarisLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { resolveNamaLokasi } from "@/lib/server/laporan/shared/lokasi";
import { parseFlagQuery, parseIdlokasiQuery, parseTanggalQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dari = parseTanggalQuery(searchParams.get("dari"));
  const sampai = parseTanggalQuery(searchParams.get("sampai"));
  const termasukDibatalkan = parseFlagQuery(searchParams.get("termasukDibatalkan"));
  const tampilkanSemua = parseFlagQuery(searchParams.get("tampilkanSemua"));
  const idlokasi = parseIdlokasiQuery(searchParams.get("idlokasi"));

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const rows = await findBarisLaporanOpnameStok(db, { dari, sampai, termasukDibatalkan, tampilkanSemua, idlokasi });
  const namaLokasi = await resolveNamaLokasi(db, idlokasi);
  const konteks = buatKonteksLaporanOpnameStok(namaPerusahaan, { dari, sampai, namaLokasi }, new Date());
  const html = renderLaporanOpnameStok(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
