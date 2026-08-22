import type { Lokasi } from "@/lib/server/lokasi/types";

const seedLokasi: Lokasi[] = [
  { kodelokasi: "LOK-0001", namalokasi: "Toko Utama (Kasir Depan)", keterangan: "Display etalase dan rak penjualan utama kasir", status: 1 },
  { kodelokasi: "LOK-0002", namalokasi: "Gudang Belakang", keterangan: "Penyimpanan stok utama dan buffer barang", status: 1 },
  { kodelokasi: "LOK-0003", namalokasi: "Rak Display Sembako", keterangan: "Rak lorong 1-3 untuk kebutuhan pokok", status: 1 },
  { kodelokasi: "LOK-0004", namalokasi: "Chiller / Showcase Minuman", keterangan: "Pendingin minuman siap minum", status: 1 },
  { kodelokasi: "LOK-0005", namalokasi: "Gudang Transit Logistik", keterangan: "Area bongkar muat barang dari supplier", status: 1 },
];

let lokasiStore: Lokasi[] = [...seedLokasi];

export function findAllLokasi(): Lokasi[] {
  return lokasiStore;
}

export function findLokasiByKode(kodelokasi: string): Lokasi | undefined {
  const lokasi = lokasiStore.find((item) => item.kodelokasi === kodelokasi);

  return lokasi;
}

export function insertLokasi(lokasi: Lokasi): void {
  lokasiStore = [...lokasiStore, lokasi];
}

export function replaceLokasi(kodelokasi: string, lokasi: Lokasi): void {
  lokasiStore = lokasiStore.map((item) => (item.kodelokasi === kodelokasi ? lokasi : item));
}

export function removeLokasi(kodelokasi: string): void {
  lokasiStore = lokasiStore.filter((item) => item.kodelokasi !== kodelokasi);
}

export function resetLokasiStoreForTests(): void {
  lokasiStore = [...seedLokasi];
}
