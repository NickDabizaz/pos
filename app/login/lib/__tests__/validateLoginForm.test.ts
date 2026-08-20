import { describe, expect, it } from "vitest";

import { validateLoginForm } from "@/app/login/lib/validateLoginForm";

describe("validateLoginForm", () => {
  it("returns no errors for a filled-in email and password", () => {
    expect(validateLoginForm({ email: "budi@norvyn.test", password: "RahasiaAman123" })).toEqual({});
  });

  it("requires email", () => {
    expect(validateLoginForm({ email: "", password: "RahasiaAman123" }).email).toBe("Email harus diisi");
  });

  it("rejects a malformed email", () => {
    expect(validateLoginForm({ email: "bukan-email", password: "RahasiaAman123" }).email).toBe(
      "Format email tidak valid",
    );
  });

  it("requires password", () => {
    expect(validateLoginForm({ email: "budi@norvyn.test", password: "" }).password).toBe("Password harus diisi");
  });
});
