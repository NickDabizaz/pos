import type { Customer } from "@/lib/server/customer/types";

const seedCustomer: Customer[] = [
  { kodecustomer: "CUST-0001", namacustomer: "Budi Santoso", telepon: "081234567890", email: "budi.santoso@gmail.com", alamat: "Jl. Sudirman No. 45, Jakarta", status: 1 },
  { kodecustomer: "CUST-0002", namacustomer: "Siti Rahmawati", telepon: "081298765432", email: "siti.rahma@yahoo.com", alamat: "Jl. Merdeka No. 12, Bandung", status: 1 },
  { kodecustomer: "CUST-0003", namacustomer: "Ahmad Hidayat", telepon: "085612345678", email: "ahmad.hidayat@outlook.com", alamat: "Jl. Diponegoro No. 88, Surabaya", status: 1 },
  { kodecustomer: "CUST-0004", namacustomer: "Dewi Lestari", telepon: "087812345678", email: "dewi.lestari@gmail.com", alamat: "Jl. Gajah Mada No. 19, Semarang", status: 1 },
  { kodecustomer: "CUST-0005", namacustomer: "Rian Prasetyo", telepon: "082198761234", email: "rian.p@gmail.com", alamat: "Jl. Pahlawan No. 5, Yogyakarta", status: 1 },
  { kodecustomer: "CUST-0006", namacustomer: "Pelanggan Umum (Walk-in)", telepon: "-", email: "-", alamat: "-", status: 1 },
];

let customerStore: Customer[] = [...seedCustomer];

export function findAllCustomer(): Customer[] {
  return customerStore;
}

export function findCustomerByKode(kodecustomer: string): Customer | undefined {
  const customer = customerStore.find((item) => item.kodecustomer === kodecustomer);

  return customer;
}

export function insertCustomer(customer: Customer): void {
  customerStore = [...customerStore, customer];
}

export function replaceCustomer(kodecustomer: string, customer: Customer): void {
  customerStore = customerStore.map((item) => (item.kodecustomer === kodecustomer ? customer : item));
}

export function removeCustomer(kodecustomer: string): void {
  customerStore = customerStore.filter((item) => item.kodecustomer !== kodecustomer);
}

export function resetCustomerStoreForTests(): void {
  customerStore = [...seedCustomer];
}
