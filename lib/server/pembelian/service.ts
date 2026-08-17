import {
  findAllPembelian,
  findPembelianByKode,
  insertPembelian,
  replacePembelian,
} from "@/lib/server/pembelian/repository";
import type { Pembelian } from "@/lib/server/pembelian/types";

export class DuplicateKodeBeliError extends Error {}
export class PembelianNotFoundError extends Error {}

export function listPembelian(): Pembelian[] {
  return findAllPembelian();
}

export function getPembelian(kodebeli: string): Pembelian {
  const found = findPembelianByKode(kodebeli);

  if (!found) {
    throw new PembelianNotFoundError(`Pembelian ${kodebeli} tidak ditemukan`);
  }

  return found;
}

export function generateKodePembelian(): string {
  const today = new Date();
  const tanggal = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const prefix = `PB-${tanggal}-`;
  const countToday = findAllPembelian().filter((item) => item.kodebeli.startsWith(prefix)).length;

  return `${prefix}${String(countToday + 1).padStart(4, "0")}`;
}

export function createPembelian(input: Pembelian): Pembelian {
  if (findPembelianByKode(input.kodebeli)) {
    throw new DuplicateKodeBeliError(`Kode pembelian ${input.kodebeli} sudah digunakan`);
  }

  insertPembelian(input);
  return input;
}

export function updatePembelian(kodebeli: string, input: Pembelian): Pembelian {
  if (!findPembelianByKode(kodebeli)) {
    throw new PembelianNotFoundError(`Pembelian ${kodebeli} tidak ditemukan`);
  }

  replacePembelian(kodebeli, input);
  return input;
}
