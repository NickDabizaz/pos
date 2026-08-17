import {
  findAllBarang,
  findBarangByKode,
  insertBarang,
  removeBarang,
  replaceBarang,
} from "@/lib/server/barang/repository";
import type { Barang } from "@/lib/server/barang/types";

export class DuplicateKodeError extends Error {}
export class BarangNotFoundError extends Error {}

export function listBarang(): Barang[] {
  return findAllBarang();
}

export function generateKodeBarang(): string {
  return `BRG-AUTO-${String(findAllBarang().length + 1).padStart(4, "0")}`;
}

export function createBarang(input: Barang): Barang {
  if (findBarangByKode(input.kodebarang)) {
    throw new DuplicateKodeError(`Kode barang ${input.kodebarang} sudah digunakan`);
  }

  insertBarang(input);
  return input;
}

export function updateBarang(kodebarang: string, input: Barang): Barang {
  if (!findBarangByKode(kodebarang)) {
    throw new BarangNotFoundError(`Barang ${kodebarang} tidak ditemukan`);
  }

  replaceBarang(kodebarang, input);
  return input;
}

export function deleteBarang(kodebarang: string): void {
  if (!findBarangByKode(kodebarang)) {
    throw new BarangNotFoundError(`Barang ${kodebarang} tidak ditemukan`);
  }

  removeBarang(kodebarang);
}
