import type { Pembelian } from "@/lib/server/pembelian/types";

const seedPembelian: Pembelian[] = [
  {
    kodebeli    : "PB-20260805-0001",
    tanggal     : "2026-08-05",
    kodesupplier: "SUP-0001",
    namasupplier: "PT Sumber Berkah Pangan",
    items       : [
      { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 40, harga: 55000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 2200000 },
      { kodebarang: "BRG-0007", namabarang: "Gula Pasir 1kg", satuan: "Bungkus", qty: 60, harga: 13000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 780000 },
    ],
    total     : 2980000,
    diskon    : 0,
    ppn       : 0,
    grandtotal: 2980000,
    status    : "S",
  },
  {
    kodebeli    : "PB-20260809-0001",
    tanggal     : "2026-08-09",
    kodesupplier: "SUP-0003",
    namasupplier: "PT Distributor Sembako Nusantara",
    items       : [
      { kodebarang: "BRG-0003", namabarang: "Minyak Goreng 2L", satuan: "Botol", qty: 24, harga: 28000, pakaiPpn: "EXCLUDE", diskon: 0, ppn: 73920, subtotal: 745920 },
    ],
    total     : 672000,
    diskon    : 0,
    ppn       : 73920,
    grandtotal: 745920,
    status    : "S",
  },
  {
    kodebeli    : "PB-20260813-0001",
    tanggal     : "2026-08-13",
    kodesupplier: "SUP-0001",
    namasupplier: "PT Sumber Berkah Pangan",
    items       : [
      { kodebarang: "BRG-0005", namabarang: "Kopi Sachet", satuan: "Pcs", qty: 200, harga: 1000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 200000 },
      { kodebarang: "BRG-0002", namabarang: "Teh Botol", satuan: "Botol", qty: 100, harga: 3000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 300000 },
    ],
    total      : 500000,
    diskon     : 0,
    ppn        : 0,
    grandtotal : 500000,
    status     : "D",
    alasanBatal: "Barang tidak sesuai kesepakatan dengan supplier",
  },
];

let pembelianStore: Pembelian[] = [...seedPembelian];

export function findAllPembelian(): Pembelian[] {
  return pembelianStore;
}

export function findPembelianByKode(kodebeli: string): Pembelian | undefined {
  return pembelianStore.find((item) => item.kodebeli === kodebeli);
}

export function insertPembelian(pembelian: Pembelian): void {
  pembelianStore = [...pembelianStore, pembelian];
}

export function replacePembelian(kodebeli: string, pembelian: Pembelian): void {
  pembelianStore = pembelianStore.map((item) => (item.kodebeli === kodebeli ? pembelian : item));
}

export function resetPembelianStoreForTests(): void {
  pembelianStore = [...seedPembelian];
}
