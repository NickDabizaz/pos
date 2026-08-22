"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import PasswordInput from "@/components/PasswordInput";

import {
  validateResetPasswordForm,
  type ResetPasswordFormErrors,
  type ResetPasswordFormValues,
} from "@/app/reset-password/lib/validateResetPasswordForm";
import { authClient, authErrorMessage } from "@/lib/client/auth";

const emptyValues: ResetPasswordFormValues = { confirmPassword: "", password: "" };

type ResetPasswordFormProps = {
  hasError: boolean;
  token   : string | null;
};

export default function ResetPasswordForm({ hasError, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [values, setValues]             = useState<ResetPasswordFormValues>(emptyValues);
  const [errors, setErrors]             = useState<ResetPasswordFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof ResetPasswordFormValues) {
    return (value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    const validationErrors = validateResetPasswordForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    const { error } = await authClient.resetPassword({ newPassword: values.password, token });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(authErrorMessage(error, "Gagal mengatur ulang password. Coba minta tautan baru."));
      return;
    }

    router.push("/login");
  }

  const tautanTidakValid = hasError || !token;

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
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Atur Ulang Password</h1>
        </div>

        {tautanTidakValid ? (
          <p className="rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            Tautan reset password ini tidak valid atau sudah kedaluwarsa.{" "}
            <Link className="font-medium underline" href="/lupa-password">
              Minta tautan baru
            </Link>
            .
          </p>
        ) : (
          <>
            {submitError && (
              <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
                {submitError}
              </p>
            )}

            <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
              <FormField error={errors.password} htmlFor="password" label="Password Baru">
                <PasswordInput
                  autoComplete="new-password"
                  hasError={Boolean(errors.password)}
                  id="password"
                  onChange={handleChange("password")}
                  value={values.password}
                />
                {!errors.password && <p className="mt-1 text-xs text-muted-foreground">Minimal 8 karakter.</p>}
              </FormField>

              <FormField error={errors.confirmPassword} htmlFor="confirmPassword" label="Konfirmasi Password Baru">
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
                {isSubmitting ? "Memproses..." : "Simpan Password Baru"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
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
