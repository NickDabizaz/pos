import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import type { Supplier, SupplierFormErrors } from "@/app/master/supplier/lib/types";
import { validateSupplierForm } from "@/app/master/supplier/lib/validateSupplierForm";

type SupplierFormModalProps = {
  initialValues: Supplier;
  mode         : "create" | "edit";
  onCancel     : () => void;
  onSubmit     : (values: Supplier) => Promise<void>;
};

export default function SupplierFormModal({
  initialValues,
  mode,
  onCancel,
  onSubmit,
}: SupplierFormModalProps) {
  const [values, setValues]             = useState<Supplier>(initialValues);
  const [errors, setErrors]             = useState<SupplierFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleTextChange(field: keyof Supplier) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateSupplierForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan supplier");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {mode === "create" ? "Tambah Supplier" : "Edit Supplier"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi data pemasok / supplier di bawah ini.
          </p>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {submitError}
          </p>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === "edit" && (
            <FormField htmlFor="kodesupplier" label="Kode Supplier">
              <input
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground"
                disabled
                id="kodesupplier"
                type="text"
                value={values.kodesupplier}
              />
            </FormField>
          )}

          <FormField error={errors.namasupplier} htmlFor="namasupplier" label="Nama Supplier / Perusahaan">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              id="namasupplier"
              onChange={handleTextChange("namasupplier")}
              placeholder="Contoh: PT Sumber Berkah Pangan"
              type="text"
              value={values.namasupplier}
            />
          </FormField>

          <FormField error={errors.kontakperson} htmlFor="kontakperson" label="Kontak Person (PIC)">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              id="kontakperson"
              onChange={handleTextChange("kontakperson")}
              placeholder="Contoh: Hendra Wijaya"
              type="text"
              value={values.kontakperson}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField error={errors.telepon} htmlFor="telepon" label="No. Telepon">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                id="telepon"
                onChange={handleTextChange("telepon")}
                placeholder="021xxxxxxx / 08xxxxxxxxxx"
                type="text"
                value={values.telepon}
              />
            </FormField>

            <FormField error={errors.email} htmlFor="email" label="Email">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                id="email"
                onChange={handleTextChange("email")}
                placeholder="sales@supplier.com"
                type="text"
                value={values.email}
              />
            </FormField>
          </div>

          <FormField error={errors.alamat} htmlFor="alamat" label="Alamat">
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              id="alamat"
              onChange={handleTextChange("alamat")}
              placeholder="Alamat kantor / gudang supplier..."
              rows={3}
              value={values.alamat}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              checked={values.status === 1}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, status: event.target.checked ? 1 : 0 }))
              }
              type="checkbox"
            />
            Aktif
          </label>

          <div className="mt-2 flex justify-end gap-3">
            <button
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              onClick={onCancel}
              type="button"
            >
              Batal
            </button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FormFieldProps = {
  children: ReactNode;
  error   ?: string;
  htmlFor  : string;
  label    : string;
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
