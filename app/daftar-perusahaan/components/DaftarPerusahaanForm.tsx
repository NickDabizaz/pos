"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  validateDaftarPerusahaanForm,
  type DaftarPerusahaanFormErrors,
  type DaftarPerusahaanFormValues,
} from "@/app/daftar-perusahaan/lib/validateDaftarPerusahaanForm";
import { daftarPerusahaan } from "@/lib/client/perusahaan";

const emptyValues: DaftarPerusahaanFormValues = { namaperusahaan: "", generateKode: true, kodeperusahaan: "" };

export default function DaftarPerusahaanForm() {
  const router = useRouter();
  const [values, setValues]             = useState<DaftarPerusahaanFormValues>(emptyValues);
  const [errors, setErrors]             = useState<DaftarPerusahaanFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateDaftarPerusahaanForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await daftarPerusahaan(values);
      router.push("/subscription");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal mendaftarkan Perusahaan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Daftarkan Perusahaan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Satu langkah lagi sebelum mulai menggunakan sistem.
          </p>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {submitError}
          </p>
        )}

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <FormField error={errors.namaperusahaan} htmlFor="namaperusahaan" label="Nama Perusahaan">
            <input
              autoComplete="organization"
              className={inputClassName(Boolean(errors.namaperusahaan))}
              id="namaperusahaan"
              onChange={(event) => setValues((previous) => ({ ...previous, namaperusahaan: event.target.value }))}
              placeholder="mis. Sumber Makmur"
              type="text"
              value={values.namaperusahaan}
            />
          </FormField>

          <FormField error={errors.kodeperusahaan} htmlFor="kodeperusahaan" label="Kode Perusahaan">
            <input
              className={`${inputClassName(Boolean(errors.kodeperusahaan))} disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground`}
              disabled={values.generateKode}
              id="kodeperusahaan"
              onChange={(event) => setValues((previous) => ({ ...previous, kodeperusahaan: event.target.value }))}
              placeholder={values.generateKode ? "Akan digenerate otomatis" : ""}
              type="text"
              value={values.generateKode ? "" : values.kodeperusahaan}
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                checked={values.generateKode}
                onChange={(event) => setValues((previous) => ({ ...previous, generateKode: event.target.checked }))}
                type="checkbox"
              />
              Generate otomatis
            </label>
          </FormField>

          <button
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Memproses..." : "Daftarkan Perusahaan"}
          </button>
        </form>
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
