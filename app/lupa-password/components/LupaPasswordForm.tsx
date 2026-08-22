"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  validateLupaPasswordForm,
  type LupaPasswordFormErrors,
  type LupaPasswordFormValues,
} from "@/app/lupa-password/lib/validateLupaPasswordForm";
import { authClient } from "@/lib/client/auth";

const emptyValues: LupaPasswordFormValues = { email: "" };

export default function LupaPasswordForm() {
  const [values, setValues]             = useState<LupaPasswordFormValues>(emptyValues);
  const [errors, setErrors]             = useState<LupaPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent]             = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateLupaPasswordForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    await authClient.requestPasswordReset({ email: values.email, redirectTo: "/reset-password" });

    setIsSubmitting(false);
    setIsSent(true);
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
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Lupa Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan email Anda, kami akan mengirimkan tautan untuk mengatur ulang password.
          </p>
        </div>

        {isSent ? (
          <p className="rounded-lg border border-status-active-border bg-status-active-bg px-3 py-2 text-sm text-status-active-fg">
            Kalau email tersebut terdaftar, tautan reset password sudah dikirim. Silakan cek kotak masuk Anda.
          </p>
        ) : (
          <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
            <FormField error={errors.email} htmlFor="email" label="Email">
              <input
                autoComplete="email"
                className={inputClassName(Boolean(errors.email))}
                id="email"
                onChange={(event) => setValues({ email: event.target.value })}
                placeholder="nama@perusahaan.com"
                type="text"
                value={values.email}
              />
            </FormField>

            <button
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Tautan Reset"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" href="/login">
            Kembali ke halaman masuk
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
