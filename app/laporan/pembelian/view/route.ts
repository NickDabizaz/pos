import { NextResponse } from "next/server";

import { buatKonteksLaporanPembelian, renderLaporanPembelian } from "@/lib/server/laporan/pembelian/render";
import { findBarisLaporanPembelian } from "@/lib/server/laporan/pembelian/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { resolveNamaLokasi } from "@/lib/server/laporan/shared/lokasi";
import { parseFlagQuery, parseIdlokasiQuery, parseTanggalQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dari = parseTanggalQuery(searchParams.get("dari"));
  const sampai = parseTanggalQuery(searchParams.get("sampai"));
  const termasukDibatalkan = parseFlagQuery(searchParams.get("termasukDibatalkan"));
  const idlokasi = parseIdlokasiQuery(searchParams.get("idlokasi"));

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const rows = await findBarisLaporanPembelian(db, { dari, sampai, termasukDibatalkan, idlokasi });
  const namaLokasi = await resolveNamaLokasi(db, idlokasi);
  const konteks = buatKonteksLaporanPembelian(namaPerusahaan, { dari, sampai, namaLokasi }, new Date());
  const html = renderLaporanPembelian(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
