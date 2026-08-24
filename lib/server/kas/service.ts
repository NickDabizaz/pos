import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import {
  findAllKas,
  findKasByKode,
  insertKasLengkap,
  updateStatusKasByKode,
  type InsertKasRincianData,
} from "@/lib/server/kas/repository";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import type { CreateKasInput, Kas } from "@/lib/server/kas/types";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";

function pesanTidakDitemukan(kodekas: string): string {
  return `Kas dengan kode "${kodekas}" tidak ditemukan`;
}

export async function listKas(db: DatabasePerusahaanClient): Promise<Kas[]> {
  const rows = await findAllKas(db);

  return rows;
}

export async function findKas(db: DatabasePerusahaanClient, kodekas: string): Promise<Kas | null> {
  const row = await findKasByKode(db, kodekas);

  return row;
}

export async function createKas(db: DatabasePerusahaanClient, input: CreateKasInput): Promise<Kas> {
  if (input.jenis !== "MASUK" && input.jenis !== "KELUAR") {
    throw new Error(`Jenis kas "${input.jenis}" tidak sah, harus MASUK atau KELUAR`, { cause: "INPUT_TIDAK_SAH" });
  }

  if (input.rincian.length === 0) {
    throw new Error("Kas harus memiliki minimal 1 baris rincian", { cause: "INPUT_TIDAK_SAH" });
  }

  const lokasi = await findLokasiByKode(db, input.kodelokasi);
  if (!lokasi) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (lokasi.status !== 1) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  const rincian: InsertKasRincianData[] = [];
  for (const item of input.rincian) {
    if (!(item.nominal > 0)) {
      throw new Error(`Nominal rincian "${item.keterangan}" harus lebih dari nol`, { cause: "INPUT_TIDAK_SAH" });
    }

    rincian.push({ keterangan: item.keterangan, nominal: item.nominal });
  }

  const grandtotal = rincian.reduce((total, item) => total + item.nominal, 0);
  const tgltrans = new Date(input.tanggal);

  const kodekas = await db.$transaction(async (tx) => {
    const kode = await simpanDenganKode(tx, "kas", tgltrans, async (kode) => {
      await insertKasLengkap(tx, kode, {
        tgltrans,
        jenis   : input.jenis,
        idlokasi: lokasi.idlokasi,
        grandtotal,
        rincian,
      });

      return kode;
    });

    return kode;
  });

  const created = await findKasByKode(db, kodekas);

  return created!;
}

export async function cancelKas(
  db          : DatabasePerusahaanClient,
  kodekas     : string,
  alasanbatal?: string,
): Promise<Kas> {
  const existing = await findKasByKode(db, kodekas);
  if (!existing) {
    throw new Error(pesanTidakDitemukan(kodekas), { cause: "TIDAK_DITEMUKAN" });
  }
  if (existing.status === "D") {
    throw new Error(`Kas "${kodekas}" sudah dibatalkan`, { cause: "SUDAH_DIBATALKAN" });
  }

  await updateStatusKasByKode(db, kodekas, alasanbatal?.trim() || null);

  const updated = await findKasByKode(db, kodekas);

  return updated!;
}
