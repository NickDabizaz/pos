import type { Supplier } from "@/lib/server/supplier/types";

const seedSupplier: Supplier[] = [
  { kodesupplier: "SUP-0001", namasupplier: "PT Sumber Berkah Pangan", kontakPerson: "Hendra Wijaya", telepon: "0215551234", email: "sales@sumberberkah.co.id", alamat: "Kawasan Industri Pulo Gadung, Jakarta Timur", status: 1 },
  { kodesupplier: "SUP-0002", namasupplier: "CV Maju Jaya Abadi", kontakPerson: "Ratna Sari", telepon: "0227891234", email: "info@majujayaabadi.com", alamat: "Jl. Soekarno Hatta No. 120, Bandung", status: 1 },
  { kodesupplier: "SUP-0003", namasupplier: "PT Distributor Sembako Nusantara", kontakPerson: "Bambang Pamungkas", telepon: "0318945612", email: "order@sembakonusantara.id", alamat: "Rungkut Industri III No. 8, Surabaya", status: 1 },
  { kodesupplier: "SUP-0004", namasupplier: "UD Harapan Mandiri", kontakPerson: "Agus Pratama", telepon: "081345678901", email: "harapanmandiri@gmail.com", alamat: "Jl. Veteran No. 44, Solo", status: 1 },
  { kodesupplier: "SUP-0005", namasupplier: "PT Aneka Minuman Segar", kontakPerson: "Lisa Indrawati", telepon: "0218899776", email: "contact@anekaminuman.co.id", alamat: "Jl. Daan Mogot Km 14, Jakarta Barat", status: 1 },
  { kodesupplier: "SUP-0006", namasupplier: "CV Stationery Supplies", kontakPerson: "Doni Setiawan", telepon: "0248412345", email: "cs@stationerysupplies.com", alamat: "Jl. Pemuda No. 70, Semarang", status: 1 },
];

let supplierStore: Supplier[] = [...seedSupplier];

export function findAllSupplier(): Supplier[] {
  return supplierStore;
}

export function findSupplierByKode(kodesupplier: string): Supplier | undefined {
  return supplierStore.find((item) => item.kodesupplier === kodesupplier);
}

export function insertSupplier(supplier: Supplier): void {
  supplierStore = [...supplierStore, supplier];
}

export function replaceSupplier(kodesupplier: string, supplier: Supplier): void {
  supplierStore = supplierStore.map((item) => (item.kodesupplier === kodesupplier ? supplier : item));
}

export function removeSupplier(kodesupplier: string): void {
  supplierStore = supplierStore.filter((item) => item.kodesupplier !== kodesupplier);
}

/** Test-only: reset the in-memory mock store back to its seed data. */
export function resetSupplierStoreForTests(): void {
  supplierStore = [...seedSupplier];
}
