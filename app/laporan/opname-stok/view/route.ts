import { NextResponse } from "next/server";

import { buatKonteksLaporanOpnameStok, renderLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/render";
import { findBarisLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { parseFlagQuery, parseTanggalQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dari = parseTanggalQuery(searchParams.get("dari"));
  const sampai = parseTanggalQuery(searchParams.get("sampai"));
  const termasukDibatalkan = parseFlagQuery(searchParams.get("termasukDibatalkan"));

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const rows = await findBarisLaporanOpnameStok(db, { dari, sampai, termasukDibatalkan });
  const konteks = buatKonteksLaporanOpnameStok(namaPerusahaan, { dari, sampai, termasukDibatalkan }, new Date());
  const html = renderLaporanOpnameStok(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
