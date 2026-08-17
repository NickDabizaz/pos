import { describe, expect, it } from "vitest";

import { filterSupplier } from "@/app/master/supplier/lib/filterSupplier";
import type { Supplier } from "@/app/master/supplier/lib/types";

const rows: Supplier[] = [
  { kodesupplier: "SUP-0001", namasupplier: "PT Sumber Berkah", kontakPerson: "Hendra Wijaya", telepon: "0215551234", email: "sales@sumberberkah.com", alamat: "Jakarta", status: 1 },
  { kodesupplier: "SUP-0002", namasupplier: "CV Maju Jaya", kontakPerson: "Ratna Sari", telepon: "0227891234", email: "info@majujaya.com", alamat: "Bandung", status: 1 },
];

describe("filterSupplier", () => {
  it("returns every row when query is empty", () => {
    expect(filterSupplier(rows, "")).toEqual(rows);
  });

  it("matches rows whose name contains the query, case-insensitively", () => {
    expect(filterSupplier(rows, "sumber")).toEqual([rows[0]]);
  });

  it("matches rows whose contact person contains the query", () => {
    expect(filterSupplier(rows, "ratna")).toEqual([rows[1]]);
  });

  it("matches rows whose kode contains the query", () => {
    expect(filterSupplier(rows, "0002")).toEqual([rows[1]]);
  });
});
