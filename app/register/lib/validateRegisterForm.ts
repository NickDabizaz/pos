const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export type RegisterFormValues = {
  confirmPassword: string;
  email           : string;
  name            : string;
  password        : string;
};

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Nama harus diisi";
  }

  if (!values.email.trim()) {
    errors.email = "Email harus diisi";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Format email tidak valid";
  }

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
