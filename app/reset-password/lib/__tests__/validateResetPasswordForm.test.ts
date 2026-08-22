import { describe, expect, it } from "vitest";

import { validateResetPasswordForm } from "@/app/reset-password/lib/validateResetPasswordForm";

describe("validateResetPasswordForm", () => {
  it("returns no errors for a matching, long-enough password", () => {
    expect(validateResetPasswordForm({ password: "PasswordBaru123", confirmPassword: "PasswordBaru123" })).toEqual({});
  });

  it("requires password", () => {
    expect(validateResetPasswordForm({ password: "", confirmPassword: "" }).password).toBe("Password harus diisi");
  });

  it("rejects a password shorter than the minimum", () => {
    expect(validateResetPasswordForm({ password: "pendek", confirmPassword: "pendek" }).password).toBe(
      "Password minimal 8 karakter",
    );
  });

  it("rejects a confirmPassword that doesn't match", () => {
    expect(validateResetPasswordForm({ password: "PasswordBaru123", confirmPassword: "Beda123456" }).confirmPassword).toBe(
      "Konfirmasi password tidak sama dengan password",
    );
  });
});
