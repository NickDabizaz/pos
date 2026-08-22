import {
  findAllBarang,
  findBarangByKode,
  insertBarang,
  removeBarang,
  replaceBarang,
} from "@/lib/server/barang/repository";
import type { Barang } from "@/lib/server/barang/types";

export function generateKodeBarang(): string {
  const kode = `BRG-AUTO-${String(findAllBarang().length + 1).padStart(4, "0")}`;

  return kode;
}

export function createBarang(input: Barang): Barang {
  if (findBarangByKode(input.kodebarang)) {
    throw new Error(`Kode barang ${input.kodebarang} sudah digunakan`);
  }

  insertBarang(input);
  return input;
}

export function updateBarang(kodebarang: string, input: Barang): Barang {
  if (!findBarangByKode(kodebarang)) {
    throw new Error(`Barang ${kodebarang} tidak ditemukan`);
  }

  replaceBarang(kodebarang, input);
  return input;
}

export function deleteBarang(kodebarang: string): void {
  if (!findBarangByKode(kodebarang)) {
    throw new Error(`Barang ${kodebarang} tidak ditemukan`);
  }

  removeBarang(kodebarang);
}
