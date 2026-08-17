import type { Penjualan } from "@/lib/server/penjualan/types";

const seedPenjualan: Penjualan[] = [
  {
    kodejual      : "PJ-20260810-0001",
    tanggal       : "2026-08-10",
    jenistransaksi: "POS",
    kodecustomer  : "CUST-0006",
    namacustomer  : "Pelanggan Umum (Walk-in)",
    items         : [
      { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 1, harga: 65000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 65000 },
      { kodebarang: "BRG-0002", namabarang: "Teh Botol", satuan: "Botol", qty: 2, harga: 5000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 10000 },
    ],
    total     : 75000,
    diskon    : 0,
    ppn       : 0,
    grandtotal: 75000,
    status    : "S",
  },
  {
    kodejual      : "PJ-20260811-0001",
    tanggal       : "2026-08-11",
    jenistransaksi: "POS",
    kodecustomer  : "CUST-0006",
    namacustomer  : "Pelanggan Umum (Walk-in)",
    items         : [
      { kodebarang: "BRG-0005", namabarang: "Kopi Sachet", satuan: "Pcs", qty: 5, harga: 2000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 10000 },
    ],
    total     : 10000,
    diskon    : 0,
    ppn       : 0,
    grandtotal: 10000,
    status    : "S",
  },
  {
    kodejual      : "PJ-20260812-0001",
    tanggal       : "2026-08-12",
    jenistransaksi: "PESANAN",
    kodecustomer  : "CUST-0001",
    namacustomer  : "Budi Santoso",
    items         : [
      { kodebarang: "BRG-0003", namabarang: "Minyak Goreng 2L", satuan: "Botol", qty: 10, harga: 34000, pakaiPpn: "EXCLUDE", diskon: 0, ppn: 37400, subtotal: 377400 },
      { kodebarang: "BRG-0007", namabarang: "Gula Pasir 1kg", satuan: "Bungkus", qty: 20, harga: 16000, pakaiPpn: "TIDAK", diskon: 20000, ppn: 0, subtotal: 300000 },
    ],
    total     : 660000,
    diskon    : 20000,
    ppn       : 37400,
    grandtotal: 677400,
    status    : "S",
  },
  {
    kodejual      : "PJ-20260814-0001",
    tanggal       : "2026-08-14",
    jenistransaksi: "PESANAN",
    kodecustomer  : "CUST-0003",
    namacustomer  : "Ahmad Hidayat",
    items         : [
      { kodebarang: "BRG-0006", namabarang: "Buku Tulis 38 Lembar", satuan: "Pcs", qty: 50, harga: 4000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 200000 },
    ],
    total      : 200000,
    diskon     : 0,
    ppn        : 0,
    grandtotal : 200000,
    status     : "D",
    alasanBatal: "Pesanan dibatalkan atas permintaan customer",
  },
];

let penjualanStore: Penjualan[] = [...seedPenjualan];

export function findAllPenjualan(): Penjualan[] {
  return penjualanStore;
}

export function findPenjualanByKode(kodejual: string): Penjualan | undefined {
  return penjualanStore.find((item) => item.kodejual === kodejual);
}

export function insertPenjualan(penjualan: Penjualan): void {
  penjualanStore = [...penjualanStore, penjualan];
}

export function replacePenjualan(kodejual: string, penjualan: Penjualan): void {
  penjualanStore = penjualanStore.map((item) => (item.kodejual === kodejual ? penjualan : item));
}

/** Test-only: reset the in-memory mock store back to its seed data. */
export function resetPenjualanStoreForTests(): void {
  penjualanStore = [...seedPenjualan];
}
