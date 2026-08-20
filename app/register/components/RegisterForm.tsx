"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import PasswordInput from "@/components/PasswordInput";

import {
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
} from "@/app/register/lib/validateRegisterForm";
import { authClient, authErrorMessage } from "@/lib/client/auth";

const emptyValues: RegisterFormValues = { confirmPassword: "", email: "", name: "", password: "" };

export default function RegisterForm() {
  const router = useRouter();
  const [values, setValues]             = useState<RegisterFormValues>(emptyValues);
  const [errors, setErrors]             = useState<RegisterFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof RegisterFormValues) {
    return (value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    const { error: signUpError } = await authClient.signUp.email({
      email   : values.email,
      name    : values.name,
      password: values.password,
    });

    setIsSubmitting(false);

    if (signUpError) {
      setSubmitError(authErrorMessage(signUpError, "Gagal mendaftar. Coba lagi."));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            POS Boilerplate
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Daftar Akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">Buat akun baru untuk mulai menggunakan sistem.</p>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {submitError}
          </p>
        )}

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <FormField error={errors.name} htmlFor="name" label="Nama">
            <input
              autoComplete="name"
              className={inputClassName(Boolean(errors.name))}
              id="name"
              onChange={(event) => handleChange("name")(event.target.value)}
              placeholder="Nama lengkap"
              type="text"
              value={values.name}
            />
          </FormField>

          <FormField error={errors.email} htmlFor="email" label="Email">
            <input
              autoComplete="email"
              className={inputClassName(Boolean(errors.email))}
              id="email"
              onChange={(event) => handleChange("email")(event.target.value)}
              placeholder="nama@perusahaan.com"
              type="text"
              value={values.email}
            />
          </FormField>

          <FormField error={errors.password} htmlFor="password" label="Password">
            <PasswordInput
              autoComplete="new-password"
              hasError={Boolean(errors.password)}
              id="password"
              onChange={handleChange("password")}
              value={values.password}
            />
            {!errors.password && <p className="mt-1 text-xs text-muted-foreground">Minimal 8 karakter.</p>}
          </FormField>

          <FormField error={errors.confirmPassword} htmlFor="confirmPassword" label="Konfirmasi Password">
            <PasswordInput
              autoComplete="new-password"
              hasError={Boolean(errors.confirmPassword)}
              id="confirmPassword"
              onChange={handleChange("confirmPassword")}
              value={values.confirmPassword}
            />
          </FormField>

          <button
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

function inputClassName(hasError: boolean): string {
  return `w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 ${
    hasError
      ? "border-status-danger-border focus:border-status-danger-border focus:ring-status-danger-border/20"
      : "border-border focus:border-ring focus:ring-ring/20"
  }`;
}

type FormFieldProps = {
  children: ReactNode;
  error?  : string;
  htmlFor : string;
  label   : string;
};

function FormField({ children, error, htmlFor, label }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-status-danger-fg">{error}</p>}
    </div>
  );
}
