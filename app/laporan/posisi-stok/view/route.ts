import { NextResponse } from "next/server";

import { buatKonteksLaporanPosisiStok, renderLaporanPosisiStok } from "@/lib/server/laporan/posisistok/render";
import { findLaporanPosisiStok } from "@/lib/server/laporan/posisistok/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { resolveNamaLokasi } from "@/lib/server/laporan/shared/lokasi";
import { parseFlagQuery, parseIdlokasiQuery, parseTanggalQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idbarangParam = searchParams.get("idbarang");
  const idbarang = idbarangParam ? Number(idbarangParam) : undefined;
  const tampilkanNol = parseFlagQuery(searchParams.get("tampilkanNol"));
  const idlokasi = parseIdlokasiQuery(searchParams.get("idlokasi"));
  const tanggal = parseTanggalQuery(searchParams.get("tanggal")) ?? new Date();

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const barang = idbarang ? await db.barang.findUnique({ where: { idbarang }, select: { namabarang: true } }) : null;
  const rows = await findLaporanPosisiStok(db, tanggal, { idbarang, tampilkanNol, idlokasi });
  const namaLokasi = await resolveNamaLokasi(db, idlokasi);
  const konteks = buatKonteksLaporanPosisiStok(
    namaPerusahaan,
    { namabarang: barang?.namabarang ?? null, tanggal, namaLokasi },
    new Date(),
  );
  const html = renderLaporanPosisiStok(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
