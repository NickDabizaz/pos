import { beforeEach, describe, expect, it } from "vitest";

import { findAllCustomer, resetCustomerStoreForTests } from "@/lib/server/customer/repository";
import { createCustomer, deleteCustomer, generateKodeCustomer, updateCustomer } from "@/lib/server/customer/service";
import type { Customer } from "@/lib/server/customer/types";

const newCustomer: Customer = {
  kodecustomer: "CUST-9999",
  namacustomer: "Pelanggan Baru",
  telepon     : "081200001111",
  email       : "baru@example.com",
  alamat      : "Jl. Baru No. 1",
  status      : 1,
};

beforeEach(() => {
  resetCustomerStoreForTests();
});

describe("createCustomer", () => {
  it("adds the item and it shows up in findAllCustomer", () => {
    createCustomer(newCustomer);

    expect(findAllCustomer()).toContainEqual(newCustomer);
  });

  it("rejects a kodecustomer that already exists", () => {
    createCustomer(newCustomer);

    expect(() => createCustomer(newCustomer)).toThrow(/sudah digunakan/);
  });
});

describe("updateCustomer", () => {
  it("replaces the item's fields", () => {
    createCustomer(newCustomer);

    const updated = updateCustomer(newCustomer.kodecustomer, {
      ...newCustomer,
      namacustomer: "Pelanggan Terupdate",
    });

    expect(updated.namacustomer).toBe("Pelanggan Terupdate");
    expect(findAllCustomer()).toContainEqual({
      ...newCustomer,
      namacustomer: "Pelanggan Terupdate",
    });
  });

  it("throws when the kodecustomer does not exist", () => {
    expect(() => updateCustomer("CUST-MISSING", newCustomer)).toThrow(/tidak ditemukan/);
  });
});

describe("deleteCustomer", () => {
  it("removes the item from findAllCustomer", () => {
    createCustomer(newCustomer);

    deleteCustomer(newCustomer.kodecustomer);

    expect(findAllCustomer()).not.toContainEqual(newCustomer);
  });

  it("throws when the kodecustomer does not exist", () => {
    expect(() => deleteCustomer("CUST-MISSING")).toThrow(/tidak ditemukan/);
  });
});

describe("generateKodeCustomer", () => {
  it("produces a non-empty code not already used by an existing item", () => {
    const generated = generateKodeCustomer();

    expect(generated).toMatch(/^CUST-AUTO-\d+$/);
    expect(findAllCustomer().some((item) => item.kodecustomer === generated)).toBe(false);
  });
});
