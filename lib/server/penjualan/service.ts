import {
  findAllPenjualan,
  findPenjualanByKode,
  insertPenjualan,
  replacePenjualan,
} from "@/lib/server/penjualan/repository";
import type { Penjualan } from "@/lib/server/penjualan/types";

export function getPenjualan(kodejual: string): Penjualan {
  const found = findPenjualanByKode(kodejual);

  if (!found) {
    throw new Error(`Penjualan ${kodejual} tidak ditemukan`, { cause: "NOT_FOUND" });
  }

  return found;
}

export function generateKodePenjualan(): string {
  const today = new Date();
  const tanggal = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const prefix = `PJ-${tanggal}-`;
  const countToday = findAllPenjualan().filter((item) => item.kodejual.startsWith(prefix)).length;
  const kode = `${prefix}${String(countToday + 1).padStart(4, "0")}`;

  return kode;
}

export function createPenjualan(input: Penjualan): Penjualan {
  if (findPenjualanByKode(input.kodejual)) {
    throw new Error(`Kode penjualan ${input.kodejual} sudah digunakan`, { cause: "DUPLICATE" });
  }

  insertPenjualan(input);

  return input;
}

export function updatePenjualan(kodejual: string, input: Penjualan): Penjualan {
  if (!findPenjualanByKode(kodejual)) {
    throw new Error(`Penjualan ${kodejual} tidak ditemukan`, { cause: "NOT_FOUND" });
  }

  replacePenjualan(kodejual, input);

  return input;
}
