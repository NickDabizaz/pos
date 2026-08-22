const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LupaPasswordFormValues = {
  email: string;
};

export type LupaPasswordFormErrors = Partial<Record<keyof LupaPasswordFormValues, string>>;

export function validateLupaPasswordForm(values: LupaPasswordFormValues): LupaPasswordFormErrors {
  const errors: LupaPasswordFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email harus diisi";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Format email tidak valid";
  }

  return errors;
}
