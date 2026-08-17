import type { Barang } from "@/lib/server/barang/types";

const seedBarang: Barang[] = [
  { kodebarang: "BRG-0001", namabarang: "Beras 5kg", kategori: "Makanan", satuan: "Karung", hargabeli: 55000, hargajual: 65000, stok: 40 },
  { kodebarang: "BRG-0002", namabarang: "Teh Botol", kategori: "Minuman", satuan: "Botol", hargabeli: 3000, hargajual: 5000, stok: 120 },
  { kodebarang: "BRG-0003", namabarang: "Minyak Goreng 2L", kategori: "Kebutuhan", satuan: "Botol", hargabeli: 28000, hargajual: 34000, stok: 25 },
  { kodebarang: "BRG-0004", namabarang: "Pulpen Standar", kategori: "ATK", satuan: "Pcs", hargabeli: 1500, hargajual: 2500, stok: 200 },
  { kodebarang: "BRG-0005", namabarang: "Kopi Sachet", kategori: "Minuman", satuan: "Pcs", hargabeli: 1000, hargajual: 2000, stok: 300 },
  { kodebarang: "BRG-0006", namabarang: "Buku Tulis 38 Lembar", kategori: "ATK", satuan: "Pcs", hargabeli: 2500, hargajual: 4000, stok: 150 },
  { kodebarang: "BRG-0007", namabarang: "Gula Pasir 1kg", kategori: "Makanan", satuan: "Bungkus", hargabeli: 13000, hargajual: 16000, stok: 60 },
  { kodebarang: "BRG-0008", namabarang: "Sabun Cuci Piring", kategori: "Kebutuhan", satuan: "Botol", hargabeli: 8000, hargajual: 11000, stok: 45 },
];

let barangStore: Barang[] = [...seedBarang];

export function findAllBarang(): Barang[] {
  return barangStore;
}

export function findBarangByKode(kodebarang: string): Barang | undefined {
  return barangStore.find((item) => item.kodebarang === kodebarang);
}

export function insertBarang(barang: Barang): void {
  barangStore = [...barangStore, barang];
}

export function replaceBarang(kodebarang: string, barang: Barang): void {
  barangStore = barangStore.map((item) => (item.kodebarang === kodebarang ? barang : item));
}

export function removeBarang(kodebarang: string): void {
  barangStore = barangStore.filter((item) => item.kodebarang !== kodebarang);
}

/** Test-only: reset the in-memory mock store back to its seed data. */
export function resetBarangStoreForTests(): void {
  barangStore = [...seedBarang];
}
