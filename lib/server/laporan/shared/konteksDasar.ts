import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findNamaperusahaanAktif } from "@/lib/server/perusahaan/repository";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

export type KonteksDasarLaporan = {
  db            : DatabasePerusahaanClient;
  namaPerusahaan: string;
};

/** Session + Database Perusahaan Aktif + nama Perusahaan Aktif, dipakai bareng oleh setiap route `view`. */
export async function resolveKonteksDasarLaporan(): Promise<KonteksDasarLaporan> {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const [db, namaPerusahaan] = await Promise.all([
    getDatabasePerusahaanAktif(prisma, idperusahaan),
    findNamaperusahaanAktif(prisma, idperusahaan),
  ]);

  return { db, namaPerusahaan: namaPerusahaan ?? "" };
}
