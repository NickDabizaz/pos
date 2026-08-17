import { describe, expect, it } from "vitest";

import { filterCustomer } from "@/app/master/customer/lib/filterCustomer";
import type { Customer } from "@/app/master/customer/lib/types";

const rows: Customer[] = [
  { kodecustomer: "CUST-0001", namacustomer: "Budi Santoso", telepon: "081234567890", email: "budi@example.com", alamat: "Jakarta", status: 1 },
  { kodecustomer: "CUST-0002", namacustomer: "Siti Rahmawati", telepon: "081298765432", email: "siti@example.com", alamat: "Bandung", status: 1 },
];

describe("filterCustomer", () => {
  it("returns every row when query is empty", () => {
    expect(filterCustomer(rows, "")).toEqual(rows);
  });

  it("matches rows whose name contains the query, case-insensitively", () => {
    expect(filterCustomer(rows, "budi")).toEqual([rows[0]]);
  });

  it("matches rows whose kode contains the query", () => {
    expect(filterCustomer(rows, "0002")).toEqual([rows[1]]);
  });

  it("matches rows whose phone contains the query", () => {
    expect(filterCustomer(rows, "9876")).toEqual([rows[1]]);
  });
});
