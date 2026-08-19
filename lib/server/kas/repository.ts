import type { Kas } from "@/lib/server/kas/types";

const seedKas: Kas[] = [
  {
    kodekas   : "KM-20260812-0001",
    tanggal   : "2026-08-12",
    jenis     : "MASUK",
    kodelokasi: "LOK-0001",
    namalokasi: "Toko Utama (Kasir Depan)",
    nominal   : 2000000,
    keterangan: "Modal tambahan disetor pemilik toko",
    status    : "S",
  },
  {
    kodekas   : "KK-20260813-0001",
    tanggal   : "2026-08-13",
    jenis     : "KELUAR",
    kodelokasi: "LOK-0001",
    namalokasi: "Toko Utama (Kasir Depan)",
    nominal   : 150000,
    keterangan: "Beli galon air minum untuk kebutuhan toko",
    status    : "S",
  },
  {
    kodekas   : "KK-20260814-0001",
    tanggal   : "2026-08-14",
    jenis     : "KELUAR",
    kodelokasi: "LOK-0002",
    namalokasi: "Gudang Belakang",
    nominal   : 300000,
    keterangan: "Bayar ongkos kirim barang dari supplier",
    status    : "S",
  },
  {
    kodekas   : "KM-20260815-0001",
    tanggal   : "2026-08-15",
    jenis     : "MASUK",
    kodelokasi: "LOK-0001",
    namalokasi: "Toko Utama (Kasir Depan)",
    nominal   : 750000,
    keterangan: "Setoran hasil penjualan online ke kas toko",
    status    : "S",
  },
  {
    kodekas    : "KK-20260816-0001",
    tanggal    : "2026-08-16",
    jenis      : "KELUAR",
    kodelokasi : "LOK-0001",
    namalokasi : "Toko Utama (Kasir Depan)",
    nominal    : 500000,
    keterangan : "Kasbon karyawan atas nama Budi",
    status     : "D",
    alasanBatal: "Salah input nominal, akan dicatat ulang dengan nominal yang benar",
  },
  {
    kodekas   : "KM-20260818-0001",
    tanggal   : "2026-08-18",
    jenis     : "MASUK",
    kodelokasi: "LOK-0002",
    namalokasi: "Gudang Belakang",
    nominal   : 200000,
    keterangan: "Pengembalian dana dari supplier karena barang retur",
    status    : "S",
  },
];

let kasStore: Kas[] = [...seedKas];

export function findAllKas(): Kas[] {
  return kasStore;
}

export function findKasByKode(kodekas: string): Kas | undefined {
  return kasStore.find((item) => item.kodekas === kodekas);
}

export function insertKas(kas: Kas): void {
  kasStore = [...kasStore, kas];
}

export function replaceKas(kodekas: string, kas: Kas): void {
  kasStore = kasStore.map((item) => (item.kodekas === kodekas ? kas : item));
}

/** Test-only: reset the in-memory mock store back to its seed data. */
export function resetKasStoreForTests(): void {
  kasStore = [...seedKas];
}
