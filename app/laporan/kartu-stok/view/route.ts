import { NextResponse } from "next/server";

import { buatKonteksLaporanKartuStok, renderLaporanKartuStok } from "@/lib/server/laporan/kartustok/render";
import { findLaporanKartuStok } from "@/lib/server/laporan/kartustok/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { resolveNamaLokasi } from "@/lib/server/laporan/shared/lokasi";
import { parseIdlokasiQuery, parseTanggalQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idbarangParam = searchParams.get("idbarang");
  const idbarang = idbarangParam ? Number(idbarangParam) : undefined;
  const dari = parseTanggalQuery(searchParams.get("dari"));
  const sampai = parseTanggalQuery(searchParams.get("sampai"));
  const idlokasi = parseIdlokasiQuery(searchParams.get("idlokasi"));

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const barang = idbarang ? await db.barang.findUnique({ where: { idbarang }, select: { namabarang: true } }) : null;
  const rows = await findLaporanKartuStok(db, { idbarang, dari, sampai, idlokasi });
  const namaLokasi = await resolveNamaLokasi(db, idlokasi);
  const konteks = buatKonteksLaporanKartuStok(
    namaPerusahaan,
    { namabarang: barang?.namabarang ?? null, dari, sampai, namaLokasi },
    new Date(),
  );
  const html = renderLaporanKartuStok(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
