import { describe, expect, it } from "vitest";

import { validateLupaPasswordForm } from "@/app/lupa-password/lib/validateLupaPasswordForm";

describe("validateLupaPasswordForm", () => {
  it("returns no errors for a filled-in email", () => {
    expect(validateLupaPasswordForm({ email: "budi@norvyn.test" })).toEqual({});
  });

  it("requires email", () => {
    expect(validateLupaPasswordForm({ email: "" }).email).toBe("Email harus diisi");
  });

  it("rejects a malformed email", () => {
    expect(validateLupaPasswordForm({ email: "bukan-email" }).email).toBe("Format email tidak valid");
  });
});
