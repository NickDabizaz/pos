import { NextResponse } from "next/server";

import { buatKonteksLaporanPosisiStok, renderLaporanPosisiStok } from "@/lib/server/laporan/posisistok/render";
import { findLaporanPosisiStok } from "@/lib/server/laporan/posisistok/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";
import { parseFlagQuery } from "@/lib/server/laporan/shared/queryParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idbarangParam = searchParams.get("idbarang");
  const idbarang = idbarangParam ? Number(idbarangParam) : undefined;
  const tampilkanNol = parseFlagQuery(searchParams.get("tampilkanNol"));

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const barang = idbarang ? await db.barang.findUnique({ where: { idbarang }, select: { namabarang: true } }) : null;

  const tanggal = new Date();
  const rows = await findLaporanPosisiStok(db, tanggal, { idbarang, tampilkanNol });
  const konteks = buatKonteksLaporanPosisiStok(namaPerusahaan, { namabarang: barang?.namabarang ?? null, tanggal }, new Date());
  const html = renderLaporanPosisiStok(rows, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
