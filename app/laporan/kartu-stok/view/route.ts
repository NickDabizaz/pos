import { NextResponse } from "next/server";

import { buatKonteksLaporanKartuStok, renderLaporanKartuStok } from "@/lib/server/laporan/kartustok/render";
import { findLaporanKartuStok } from "@/lib/server/laporan/kartustok/repository";
import { resolveKonteksDasarLaporan } from "@/lib/server/laporan/shared/konteksDasar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idbarangParam = searchParams.get("idbarang");
  const idbarang = idbarangParam ? Number(idbarangParam) : undefined;

  const { db, namaPerusahaan } = await resolveKonteksDasarLaporan();

  const barang = idbarang ? await db.barang.findUnique({ where: { idbarang }, select: { namabarang: true } }) : null;

  const grup = await findLaporanKartuStok(db, { idbarang });
  const konteks = buatKonteksLaporanKartuStok(namaPerusahaan, { namabarang: barang?.namabarang ?? null }, new Date());
  const html = renderLaporanKartuStok(grup, konteks);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
