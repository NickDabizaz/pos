import { prisma } from "@/lib/prisma";
import { requirePerusahaanAktif } from "@/lib/server/auth/guard";
import { getDatabasePerusahaanAktif } from "@/lib/server/perusahaan/service";

export const POS_KODELOKASI = "TOKO";

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function resolveShiftRouteContext() {
  const session = await requirePerusahaanAktif();
  const idperusahaan = session.session.idperusahaan;
  if (!idperusahaan) {
    throw new Error("Perusahaan Aktif tidak ditemukan pada sesi", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }

  const db = await getDatabasePerusahaanAktif(prisma, idperusahaan);

  return { db, idkasir: session.user.id };
}
