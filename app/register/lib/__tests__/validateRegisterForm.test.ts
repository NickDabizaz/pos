import { describe, expect, it } from "vitest";

import { validateRegisterForm } from "@/app/register/lib/validateRegisterForm";

const validValues = {
  confirmPassword: "RahasiaAman123",
  email          : "budi@norvyn.test",
  name           : "Budi",
  password       : "RahasiaAman123",
};

describe("validateRegisterForm", () => {
  it("returns no errors for a fully filled-in, matching form", () => {
    expect(validateRegisterForm(validValues)).toEqual({});
  });

  it("requires name", () => {
    expect(validateRegisterForm({ ...validValues, name: "" }).name).toBe("Nama harus diisi");
  });

  it("requires email", () => {
    expect(validateRegisterForm({ ...validValues, email: "" }).email).toBe("Email harus diisi");
  });

  it("rejects a malformed email", () => {
    expect(validateRegisterForm({ ...validValues, email: "bukan-email" }).email).toBe("Format email tidak valid");
  });

  it("requires a password of at least 8 characters", () => {
    expect(validateRegisterForm({ ...validValues, confirmPassword: "pendek1", password: "pendek1" }).password).toBe(
      "Password minimal 8 karakter",
    );
  });

  it("requires confirm password to match password", () => {
    expect(validateRegisterForm({ ...validValues, confirmPassword: "BedaSekali123" }).confirmPassword).toBe(
      "Konfirmasi password tidak sama dengan password",
    );
  });

  it("requires confirm password to be filled", () => {
    expect(validateRegisterForm({ ...validValues, confirmPassword: "" }).confirmPassword).toBe(
      "Konfirmasi password harus diisi",
    );
  });
});
