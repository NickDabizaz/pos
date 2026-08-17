import { beforeEach, describe, expect, it } from "vitest";

import { resetSupplierStoreForTests } from "@/lib/server/supplier/repository";
import {
  createSupplier,
  deleteSupplier,
  DuplicateKodeError,
  generateKodeSupplier,
  listSupplier,
  SupplierNotFoundError,
  updateSupplier,
} from "@/lib/server/supplier/service";
import type { Supplier } from "@/lib/server/supplier/types";

const newSupplier: Supplier = {
  kodesupplier: "SUP-9999",
  namasupplier: "Supplier Baru",
  kontakPerson: "John Doe",
  telepon     : "02199998888",
  email       : "supplierbaru@example.com",
  alamat      : "Jl. Industri Baru No. 9",
  status      : 1,
};

beforeEach(() => {
  resetSupplierStoreForTests();
});

describe("createSupplier", () => {
  it("adds the item and it shows up in listSupplier", () => {
    createSupplier(newSupplier);

    expect(listSupplier()).toContainEqual(newSupplier);
  });

  it("rejects a kodesupplier that already exists", () => {
    createSupplier(newSupplier);

    expect(() => createSupplier(newSupplier)).toThrow(DuplicateKodeError);
  });
});

describe("updateSupplier", () => {
  it("replaces the item's fields", () => {
    createSupplier(newSupplier);

    const updated = updateSupplier(newSupplier.kodesupplier, {
      ...newSupplier,
      namasupplier: "Supplier Terupdate",
    });

    expect(updated.namasupplier).toBe("Supplier Terupdate");
    expect(listSupplier()).toContainEqual({
      ...newSupplier,
      namasupplier: "Supplier Terupdate",
    });
  });

  it("throws when the kodesupplier does not exist", () => {
    expect(() => updateSupplier("SUP-MISSING", newSupplier)).toThrow(SupplierNotFoundError);
  });
});

describe("deleteSupplier", () => {
  it("removes the item from listSupplier", () => {
    createSupplier(newSupplier);

    deleteSupplier(newSupplier.kodesupplier);

    expect(listSupplier()).not.toContainEqual(newSupplier);
  });

  it("throws when the kodesupplier does not exist", () => {
    expect(() => deleteSupplier("SUP-MISSING")).toThrow(SupplierNotFoundError);
  });
});

describe("generateKodeSupplier", () => {
  it("produces a non-empty code not already used by an existing item", () => {
    const generated = generateKodeSupplier();

    expect(generated).toMatch(/^SUP-AUTO-\d+$/);
    expect(listSupplier().some((item) => item.kodesupplier === generated)).toBe(false);
  });
});
