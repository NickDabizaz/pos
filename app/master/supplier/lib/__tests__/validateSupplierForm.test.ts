import { describe, expect, it } from "vitest";

import { validateSupplierForm } from "@/app/master/supplier/lib/validateSupplierForm";
import type { Supplier } from "@/app/master/supplier/lib/types";

const validSupplier: Supplier = {
  idsupplier  : 1,
  kodesupplier: "SUP-0001",
  namasupplier: "PT Sumber Berkah",
  kontakperson: "Hendra Wijaya",
  telepon     : "0215551234",
  email       : "sales@sumberberkah.com",
  alamat      : "Jakarta",
  status      : 1,
};

describe("validateSupplierForm", () => {
  it("returns no errors for a valid supplier", () => {
    expect(validateSupplierForm(validSupplier)).toEqual({});
  });

  it("requires namasupplier", () => {
    const errors = validateSupplierForm({ ...validSupplier, namasupplier: "   " });
    expect(errors.namasupplier).toBe("Nama supplier wajib diisi");
  });

  it("validates email format if filled", () => {
    const errors = validateSupplierForm({ ...validSupplier, email: "invalid-email" });
    expect(errors.email).toBe("Format email tidak valid");
  });

  it("accepts valid email or hyphen", () => {
    const errors = validateSupplierForm({ ...validSupplier, email: "-" });
    expect(errors.email).toBeUndefined();
  });
});
