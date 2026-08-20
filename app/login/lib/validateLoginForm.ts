const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginFormValues = {
  email   : string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email harus diisi";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Format email tidak valid";
  }

  if (!values.password) {
    errors.password = "Password harus diisi";
  }

  return errors;
}
