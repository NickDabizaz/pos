import { findAllKas, findKasByKode, insertKas, replaceKas } from "@/lib/server/kas/repository";
import type { JenisKas, Kas } from "@/lib/server/kas/types";

export class DuplicateKodeKasError extends Error {}
export class KasNotFoundError extends Error {}

export function listKas(): Kas[] {
  return findAllKas();
}

export function getKas(kodekas: string): Kas {
  const found = findKasByKode(kodekas);

  if (!found) {
    throw new KasNotFoundError(`Kas ${kodekas} tidak ditemukan`);
  }

  return found;
}

export function generateKodeKas(jenis: JenisKas): string {
  const today = new Date();
  const tanggal = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const prefix = `${jenis === "MASUK" ? "KM" : "KK"}-${tanggal}-`;
  const countToday = findAllKas().filter((item) => item.kodekas.startsWith(prefix)).length;

  return `${prefix}${String(countToday + 1).padStart(4, "0")}`;
}

export function createKas(input: Kas): Kas {
  if (findKasByKode(input.kodekas)) {
    throw new DuplicateKodeKasError(`Kode kas ${input.kodekas} sudah digunakan`);
  }

  insertKas(input);
  return input;
}

export function updateKas(kodekas: string, input: Kas): Kas {
  if (!findKasByKode(kodekas)) {
    throw new KasNotFoundError(`Kas ${kodekas} tidak ditemukan`);
  }

  replaceKas(kodekas, input);
  return input;
}
