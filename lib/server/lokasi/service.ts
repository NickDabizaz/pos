import {
  findAllLokasi,
  findLokasiByKode,
  insertLokasi,
  removeLokasi,
  replaceLokasi,
} from "@/lib/server/lokasi/repository";
import type { Lokasi } from "@/lib/server/lokasi/types";

export function generateKodeLokasi(): string {
  const kode = `LOK-AUTO-${String(findAllLokasi().length + 1).padStart(4, "0")}`;

  return kode;
}

export function createLokasi(input: Lokasi): Lokasi {
  if (findLokasiByKode(input.kodelokasi)) {
    throw new Error(`Kode lokasi ${input.kodelokasi} sudah digunakan`);
  }

  insertLokasi(input);
  return input;
}

export function updateLokasi(kodelokasi: string, input: Lokasi): Lokasi {
  if (!findLokasiByKode(kodelokasi)) {
    throw new Error(`Lokasi ${kodelokasi} tidak ditemukan`);
  }

  replaceLokasi(kodelokasi, input);
  return input;
}

export function deleteLokasi(kodelokasi: string): void {
  if (!findLokasiByKode(kodelokasi)) {
    throw new Error(`Lokasi ${kodelokasi} tidak ditemukan`);
  }

  removeLokasi(kodelokasi);
}
