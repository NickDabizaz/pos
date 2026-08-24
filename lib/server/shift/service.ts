import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";
import type { Lokasi } from "@/lib/server/lokasi/types";
import {
  deleteSetoranKasir,
  findModalAwal,
  findSetoranKasir,
  insertModalAwal,
  insertSetoranKasir,
  sumPembayaranHarian,
  type ModalAwalRow,
} from "@/lib/server/shift/repository";
import type {
  CancelCloseShiftInput,
  CloseShiftInput,
  OpenShiftInput,
  Shift,
  ShiftStatusInput,
} from "@/lib/server/shift/types";
import { findUserNama } from "@/lib/server/user/repository";
import type { GlobalClient } from "@/lib/server/user/types";

const NAMA_KASIR_FALLBACK = "Pengguna Tidak Dikenal";

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function resolveLokasiAktif(db: DatabasePerusahaanClient, kodelokasi: string): Promise<Lokasi> {
  const lokasi = await findLokasiByKode(db, kodelokasi);
  if (!lokasi) {
    throw new Error(`Lokasi dengan kode "${kodelokasi}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (lokasi.status !== 1) {
    throw new Error(`Lokasi dengan kode "${kodelokasi}" nonaktif, tidak bisa dipakai membuka Shift`, { cause: "INPUT_TIDAK_SAH" });
  }

  return lokasi;
}

async function resolveNamaKasir(globalDb: GlobalClient, idkasir: string): Promise<string> {
  const nama = await findUserNama(globalDb, idkasir);

  return nama ?? NAMA_KASIR_FALLBACK;
}

async function buildShiftSnapshot(
  db        : DatabasePerusahaanClient,
  globalDb  : GlobalClient,
  tanggal   : string,
  kodelokasi: string,
  lokasi    : Lokasi,
  modalAwal : ModalAwalRow,
): Promise<Shift> {
  const tgltrans = new Date(tanggal);
  const namakasir = await resolveNamaKasir(globalDb, modalAwal.idkasir);
  const agregasi = await sumPembayaranHarian(db, tgltrans, lokasi.idlokasi);
  const setoran = await findSetoranKasir(db, tgltrans, lokasi.idlokasi);

  if (!setoran) {
    return {
      status         : "TERBUKA",
      tanggal,
      kodelokasi,
      idkasir        : modalAwal.idkasir,
      namakasir,
      modalawal      : Number(modalAwal.nominal),
      totaltunai     : agregasi.totaltunai,
      totalnontunai  : agregasi.totalnontunai,
      jumlahtransaksi: agregasi.jumlahtransaksi,
    };
  }

  return {
    status         : "TERTUTUP",
    tanggal,
    kodelokasi,
    idkasir        : modalAwal.idkasir,
    namakasir,
    modalawal      : Number(modalAwal.nominal),
    totaltunai     : Number(setoran.totaltunai),
    totalnontunai  : Number(setoran.totalnontunai),
    jumlahtransaksi: agregasi.jumlahtransaksi,
    kasaktual      : Number(setoran.kasaktual),
    selisih        : Number(setoran.selisih),
    catatan        : setoran.catatan,
  };
}

export async function getShiftStatus(
  db      : DatabasePerusahaanClient,
  globalDb: GlobalClient,
  input   : ShiftStatusInput,
): Promise<Shift> {
  const lokasi = await resolveLokasiAktif(db, input.kodelokasi);
  const tgltrans = new Date(input.tanggal);
  const modalAwal = await findModalAwal(db, tgltrans, lokasi.idlokasi);

  if (!modalAwal) {
    return { status: "BELUM_DIBUKA", tanggal: input.tanggal, kodelokasi: input.kodelokasi };
  }

  return buildShiftSnapshot(db, globalDb, input.tanggal, input.kodelokasi, lokasi, modalAwal);
}

export async function openShift(
  db      : DatabasePerusahaanClient,
  globalDb: GlobalClient,
  input   : OpenShiftInput,
): Promise<Shift> {
  if (!(input.modalawal >= 0)) {
    throw new Error("Nominal Modal Awal tidak boleh negatif", { cause: "INPUT_TIDAK_SAH" });
  }

  const lokasi = await resolveLokasiAktif(db, input.kodelokasi);
  const tgltrans = new Date(input.tanggal);

  const existing = await findModalAwal(db, tgltrans, lokasi.idlokasi);
  if (existing) {
    const setoran = await findSetoranKasir(db, tgltrans, lokasi.idlokasi);
    if (setoran) {
      throw new Error(
        "Shift hari ini sudah ditutup. Batalkan penutupan untuk melanjutkan, bukan membuka shift baru.",
        { cause: "SHIFT_KONFLIK" },
      );
    }
    throw new Error("Shift sudah terbuka untuk Lokasi dan tanggal ini", { cause: "SHIFT_KONFLIK" });
  }

  try {
    await insertModalAwal(db, tgltrans, lokasi.idlokasi, input.idkasir, input.modalawal);
  } catch (error) {
    if (isUniqueConstraint(error)) {
      throw new Error("Shift sudah terbuka untuk Lokasi dan tanggal ini", { cause: "SHIFT_KONFLIK" });
    }
    throw error;
  }

  return getShiftStatus(db, globalDb, { tanggal: input.tanggal, kodelokasi: input.kodelokasi });
}

export async function closeShift(
  db      : DatabasePerusahaanClient,
  globalDb: GlobalClient,
  input   : CloseShiftInput,
): Promise<Shift> {
  if (!(input.kasaktual >= 0)) {
    throw new Error("Nominal kas aktual tidak boleh negatif", { cause: "INPUT_TIDAK_SAH" });
  }

  const lokasi = await resolveLokasiAktif(db, input.kodelokasi);
  const tgltrans = new Date(input.tanggal);

  const modalAwal = await findModalAwal(db, tgltrans, lokasi.idlokasi);
  if (!modalAwal) {
    throw new Error("Shift belum dibuka untuk Lokasi dan tanggal ini", { cause: "SHIFT_BELUM_DIBUKA" });
  }

  const existingSetoran = await findSetoranKasir(db, tgltrans, lokasi.idlokasi);
  if (existingSetoran) {
    throw new Error("Shift ini sudah ditutup", { cause: "SHIFT_SUDAH_TERTUTUP" });
  }

  const agregasi = await sumPembayaranHarian(db, tgltrans, lokasi.idlokasi);
  const totalDiharapkan = Number(modalAwal.nominal) + agregasi.totaltunai;
  const selisih = input.kasaktual - totalDiharapkan;

  try {
    await insertSetoranKasir(db, tgltrans, lokasi.idlokasi, {
      totaltunai   : agregasi.totaltunai,
      totalnontunai: agregasi.totalnontunai,
      kasaktual    : input.kasaktual,
      selisih,
      catatan      : input.catatan?.trim() || null,
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      throw new Error("Shift ini sudah ditutup", { cause: "SHIFT_SUDAH_TERTUTUP" });
    }
    throw error;
  }

  return getShiftStatus(db, globalDb, { tanggal: input.tanggal, kodelokasi: input.kodelokasi });
}

export async function cancelCloseShift(
  db      : DatabasePerusahaanClient,
  globalDb: GlobalClient,
  input   : CancelCloseShiftInput,
): Promise<Shift> {
  const lokasi = await resolveLokasiAktif(db, input.kodelokasi);
  const tgltrans = new Date(input.tanggal);

  const modalAwal = await findModalAwal(db, tgltrans, lokasi.idlokasi);
  if (!modalAwal) {
    throw new Error("Shift belum pernah dibuka untuk Lokasi dan tanggal ini", { cause: "SHIFT_BELUM_DIBUKA" });
  }

  const setoran = await findSetoranKasir(db, tgltrans, lokasi.idlokasi);
  if (!setoran) {
    throw new Error("Shift ini belum ditutup, tidak ada penutupan yang perlu dibatalkan", { cause: "SHIFT_BELUM_TERTUTUP" });
  }

  await deleteSetoranKasir(db, tgltrans, lokasi.idlokasi);

  return getShiftStatus(db, globalDb, { tanggal: input.tanggal, kodelokasi: input.kodelokasi });
}
