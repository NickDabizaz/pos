import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import {
  findAllKas,
  findKasByKode,
  insertKasLengkap,
  updateKasLengkap,
  updateStatusKasByKode,
  type InsertKasRincianData,
} from "@/lib/server/kas/repository";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import type { CreateKasInput, CreateKasRincianInput, JenisKas, Kas, UpdateKasInput } from "@/lib/server/kas/types";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";
import { deleteJurnal } from "@/lib/server/jurnal/repository";
import { insertJurnalKas, petakanJenisKas } from "@/lib/server/jurnal/service";

function pesanTidakDitemukan(kodekas: string): string {
  return `Kas dengan kode "${kodekas}" tidak ditemukan`;
}

function cekJenisKas(jenis: JenisKas): void {
  if (jenis !== "MASUK" && jenis !== "KELUAR") {
    throw new Error(`Jenis kas "${jenis}" tidak sah, harus MASUK atau KELUAR`, { cause: "INPUT_TIDAK_SAH" });
  }
}

function cekDanHitungRincian(rincian: CreateKasRincianInput[]): InsertKasRincianData[] {
  if (rincian.length === 0) {
    throw new Error("Kas harus memiliki minimal 1 baris rincian", { cause: "INPUT_TIDAK_SAH" });
  }

  const hasil: InsertKasRincianData[] = [];

  for (const item of rincian) {
    if (!(item.nominal > 0)) {
      throw new Error(`Nominal rincian "${item.keterangan}" harus lebih dari nol`, { cause: "INPUT_TIDAK_SAH" });
    }

    hasil.push({ keterangan: item.keterangan, nominal: item.nominal });
  }

  return hasil;
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
  cekJenisKas(input.jenis);

  const rincian = cekDanHitungRincian(input.rincian);

  const lokasi = await findLokasiByKode(db, input.kodelokasi);
  if (!lokasi) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (lokasi.status !== 1) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  const grandtotal = rincian.reduce((total, item) => total + item.nominal, 0);
  const tgltrans = new Date(input.tanggal);

  const kodekas = await db.$transaction(async (tx) => {
    const kode = await simpanDenganKode(tx, "KAS", tgltrans, async (kode) => {
      const idkas = await insertKasLengkap(tx, kode, {
        tgltrans,
        jenis   : input.jenis,
        idlokasi: lokasi.idlokasi,
        grandtotal,
        rincian,
      });

      await insertJurnalKas(
        tx,
        { idkas, kodekas: kode, tgltrans, idlokasi: lokasi.idlokasi },
        input.jenis,
        rincian,
      );

      return kode;
    });

    return kode;
  });

  const created = await findKasByKode(db, kodekas);

  return created!;
}

export async function updateKas(
  db     : DatabasePerusahaanClient,
  kodekas: string,
  input  : UpdateKasInput,
): Promise<Kas> {
  const existing = await findKasByKode(db, kodekas);
  if (!existing) {
    throw new Error(pesanTidakDitemukan(kodekas), { cause: "TIDAK_DITEMUKAN" });
  }
  if (existing.status === "D") {
    throw new Error(`Kas "${kodekas}" sudah dibatalkan`, { cause: "SUDAH_DIBATALKAN" });
  }

  cekJenisKas(input.jenis);

  const rincian = cekDanHitungRincian(input.rincian);
  const grandtotal = rincian.reduce((total, item) => total + item.nominal, 0);

  await db.$transaction(async (tx) => {
    const induk = await updateKasLengkap(tx, kodekas, {
      jenis   : input.jenis,
      grandtotal,
      rincian,
    });

    await deleteJurnal(tx, petakanJenisKas(existing.jenis), induk.idkas);

    await insertJurnalKas(
      tx,
      { idkas: induk.idkas, kodekas, tgltrans: induk.tgltrans, idlokasi: induk.idlokasi },
      input.jenis,
      rincian,
    );
  });

  const terbaru = await findKasByKode(db, kodekas);

  return terbaru!;
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

  await db.$transaction(async (tx) => {
    const idkas = await updateStatusKasByKode(tx, kodekas, alasanbatal?.trim() || null);

    await deleteJurnal(tx, petakanJenisKas(existing.jenis), idkas);
  });

  const updated = await findKasByKode(db, kodekas);

  return updated!;
}
