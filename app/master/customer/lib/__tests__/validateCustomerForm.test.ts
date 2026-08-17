import { describe, expect, it } from "vitest";

import { validateCustomerForm } from "@/app/master/customer/lib/validateCustomerForm";
import type { Customer } from "@/app/master/customer/lib/types";

const validCustomer: Customer = {
  kodecustomer: "CUST-0001",
  namacustomer: "Budi Santoso",
  telepon     : "081234567890",
  email       : "budi@example.com",
  alamat      : "Jakarta",
  status      : 1,
};

describe("validateCustomerForm", () => {
  it("returns no errors for a valid customer", () => {
    expect(validateCustomerForm(validCustomer)).toEqual({});
  });

  it("requires kodecustomer when skipKodecustomer is not set", () => {
    const errors = validateCustomerForm({ ...validCustomer, kodecustomer: "" });
    expect(errors.kodecustomer).toBe("Kode customer wajib diisi");
  });

  it("skips kodecustomer validation when skipKodecustomer is true", () => {
    const errors = validateCustomerForm(
      { ...validCustomer, kodecustomer: "" },
      { skipKodecustomer: true },
    );
    expect(errors.kodecustomer).toBeUndefined();
  });

  it("requires namacustomer", () => {
    const errors = validateCustomerForm({ ...validCustomer, namacustomer: "   " });
    expect(errors.namacustomer).toBe("Nama customer wajib diisi");
  });

  it("validates email format if filled", () => {
    const errors = validateCustomerForm({ ...validCustomer, email: "invalid-email" });
    expect(errors.email).toBe("Format email tidak valid");
  });

  it("accepts hyphen or valid email", () => {
    const errors = validateCustomerForm({ ...validCustomer, email: "-" });
    expect(errors.email).toBeUndefined();
  });
});
