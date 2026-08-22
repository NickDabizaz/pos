const MIN_PASSWORD_LENGTH = 8;

export type ResetPasswordFormValues = {
  confirmPassword: string;
  password       : string;
};

export type ResetPasswordFormErrors = Partial<Record<keyof ResetPasswordFormValues, string>>;

export function validateResetPasswordForm(values: ResetPasswordFormValues): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};

  if (!values.password) {
    errors.password = "Password harus diisi";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password minimal ${MIN_PASSWORD_LENGTH} karakter`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password harus diisi";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Konfirmasi password tidak sama dengan password";
  }

  return errors;
}
