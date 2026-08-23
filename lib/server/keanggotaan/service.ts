import {
  countOwners,
  deleteMembership,
  insertMembership,
  isKonflikMembership,
  updateIsOwner,
} from "@/lib/server/keanggotaan/repository";
import type { CabutStatusOwnerInput, GlobalClient, KeluarkanAnggotaInput, TambahAnggotaInput } from "@/lib/server/keanggotaan/types";
import { deleteUsermenuUntukAnggota } from "@/lib/server/menu/repository";
import { findMembershipDenganOwner } from "@/lib/server/perusahaan/repository";
import { cekPemanggilOwner } from "@/lib/server/perusahaan/service";

export async function tambahAnggota(db: GlobalClient, input: TambahAnggotaInput): Promise<void> {
  await cekPemanggilOwner(db, input.idpemanggil, input.idperusahaan);

  try {
    await insertMembership(db, input.idusertarget, input.idperusahaan);
  } catch (error) {
    if (isKonflikMembership(error)) {
      throw new Error("Pengguna tersebut sudah menjadi anggota Perusahaan ini", { cause: "SUDAH_ANGGOTA" });
    }
    throw error;
  }
}

async function cekBukanSatuSatunyaOwner(db: GlobalClient, idperusahaan: number): Promise<void> {
  const jumlahOwner = await countOwners(db, idperusahaan);
  if (jumlahOwner <= 1) {
    throw new Error("Owner satu-satunya di Perusahaan ini tidak dapat dicabut/dikeluarkan", { cause: "SATU_SATUNYA_OWNER" });
  }
}

export async function keluarkanAnggota(db: GlobalClient, input: KeluarkanAnggotaInput): Promise<void> {
  await cekPemanggilOwner(db, input.idpemanggil, input.idperusahaan);

  const target = await findMembershipDenganOwner(db, input.idusertarget, input.idperusahaan);
  if (!target) {
    throw new Error("Pengguna tersebut bukan anggota Perusahaan ini", { cause: "BUKAN_ANGGOTA" });
  }
  if (target.isowner) {
    await cekBukanSatuSatunyaOwner(db, input.idperusahaan);
  }

  const jumlahTerhapus = await deleteMembership(db, input.idusertarget, input.idperusahaan);
  if (jumlahTerhapus === 0) {
    throw new Error("Pengguna tersebut bukan anggota Perusahaan ini", { cause: "BUKAN_ANGGOTA" });
  }

  await deleteUsermenuUntukAnggota(db, input.idusertarget, input.idperusahaan);
}

export async function cabutStatusOwner(db: GlobalClient, input: CabutStatusOwnerInput): Promise<void> {
  await cekPemanggilOwner(db, input.idpemanggil, input.idperusahaan);

  const target = await findMembershipDenganOwner(db, input.idusertarget, input.idperusahaan);
  if (!target) {
    throw new Error("Pengguna tersebut bukan anggota Perusahaan ini", { cause: "BUKAN_ANGGOTA" });
  }
  if (!target.isowner) {
    throw new Error("Pengguna tersebut bukan Owner", { cause: "TARGET_BUKAN_OWNER" });
  }

  await cekBukanSatuSatunyaOwner(db, input.idperusahaan);

  await updateIsOwner(db, input.idusertarget, input.idperusahaan, false);
}
