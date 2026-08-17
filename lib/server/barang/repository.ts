import type { Barang } from "@/lib/server/barang/types";

const seedBarang: Barang[] = [
  { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", hargabeli: 55000, hargajual: 65000, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0002", namabarang: "Teh Botol", satuan: "Botol", hargabeli: 3000, hargajual: 5000, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0003", namabarang: "Minyak Goreng 2L", satuan: "Botol", hargabeli: 28000, hargajual: 34000, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0004", namabarang: "Pulpen Standar", satuan: "Pcs", hargabeli: 1500, hargajual: 2500, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0005", namabarang: "Kopi Sachet", satuan: "Pcs", hargabeli: 1000, hargajual: 2000, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0006", namabarang: "Buku Tulis 38 Lembar", satuan: "Pcs", hargabeli: 2500, hargajual: 4000, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0007", namabarang: "Gula Pasir 1kg", satuan: "Bungkus", hargabeli: 13000, hargajual: 16000, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0008", namabarang: "Sabun Cuci Piring", satuan: "Botol", hargabeli: 8000, hargajual: 11000, pakaiStok: false, status: 0 },
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
