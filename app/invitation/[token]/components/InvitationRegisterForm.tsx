"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import PasswordInput from "@/components/PasswordInput";

import { validateRegisterForm, type RegisterFormErrors, type RegisterFormValues } from "@/app/register/lib/validateRegisterForm";
import { authClient, authErrorMessage } from "@/lib/client/auth";
import { gabungViaInvitation } from "@/lib/client/invitation";

const emptyValues: RegisterFormValues = { confirmPassword: "", email: "", name: "", password: "" };

type InvitationRegisterFormProps = {
  namaperusahaan: string;
  token         : string;
};

export default function InvitationRegisterForm({ namaperusahaan, token }: InvitationRegisterFormProps) {
  const router = useRouter();
  const [values, setValues]             = useState<RegisterFormValues>(emptyValues);
  const [errors, setErrors]             = useState<RegisterFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [sudahPunyaAkun, setSudahPunyaAkun] = useState(false);
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
    setSudahPunyaAkun(false);
    setIsSubmitting(true);

    const { error: signUpError } = await authClient.signUp.email({
      email      : values.email,
      name       : values.name,
      password   : values.password,
      callbackURL: "/verifikasi-email",
    });

    if (signUpError) {
      setIsSubmitting(false);
      setSudahPunyaAkun(signUpError.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL");
      setSubmitError(authErrorMessage(signUpError, "Gagal mendaftar. Coba lagi."));
      return;
    }

    try {
      await gabungViaInvitation(token);
      router.push("/");
      router.refresh();
    } catch (joinError) {
      setIsSubmitting(false);
      setSubmitError(joinError instanceof Error ? joinError.message : "Gagal bergabung ke Perusahaan");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gabung ke {namaperusahaan}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Buat akun untuk bergabung sebagai anggota Perusahaan ini.</p>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {submitError}
            {sudahPunyaAkun && (
              <>
                {" "}
                <Link className="font-medium underline" href="/login">
                  Masuk
                </Link>{" "}
                lalu buka kembali link invitation ini.
              </>
            )}
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
              placeholder="nama@email.com"
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
            {isSubmitting ? "Memproses..." : "Daftar & Gabung"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">atau</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton
          callbackURL={`/invitation/${token}`}
          label="Gabung dengan Google"
          onError={setSubmitError}
        />
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
