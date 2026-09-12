import { NextResponse } from "next/server";

import { buatKonteksLaporanJurnal, renderLaporanJurnal } from "@/lib/server/laporan/jurnal/render";
import { findBarisLaporanJurnal } from "@/lib/server/laporan/jurnal/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { resolveNamaLokasi } from "@/lib/server/laporan/shared/lokasi";
import { parseIdlokasiQuery, parseTanggalQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kodetrans = searchParams.get("kodetrans")?.trim() || undefined;
  const dari = parseTanggalQuery(searchParams.get("dari"));
  const sampai = parseTanggalQuery(searchParams.get("sampai"));
  const idlokasi = parseIdlokasiQuery(searchParams.get("idlokasi"));

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const rows = await findBarisLaporanJurnal(db, { kodetrans, dari, sampai, idlokasi });
  const namaLokasi = await resolveNamaLokasi(db, idlokasi);
  const konteks = buatKonteksLaporanJurnal(namaPerusahaan, { kodetrans, dari, sampai, namaLokasi }, new Date());
  const html = renderLaporanJurnal(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
