import { NextResponse } from "next/server";

import { buatKonteksLaporanPembelian, renderLaporanPembelian } from "@/lib/server/laporan/pembelian/render";
import { findBarisLaporanPembelian } from "@/lib/server/laporan/pembelian/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { parseFlagQuery, parseTanggalQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dari = parseTanggalQuery(searchParams.get("dari"));
  const sampai = parseTanggalQuery(searchParams.get("sampai"));
  const termasukDibatalkan = parseFlagQuery(searchParams.get("termasukDibatalkan"));

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const rows = await findBarisLaporanPembelian(db, { dari, sampai, termasukDibatalkan });
  const konteks = buatKonteksLaporanPembelian(namaPerusahaan, { dari, sampai, termasukDibatalkan }, new Date());
  const html = renderLaporanPembelian(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
