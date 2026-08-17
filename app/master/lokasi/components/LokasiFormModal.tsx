import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import type { Lokasi, LokasiFormErrors } from "@/app/master/lokasi/lib/types";
import { validateLokasiForm } from "@/app/master/lokasi/lib/validateLokasiForm";

type LokasiFormModalProps = {
  initialValues: Lokasi;
  mode         : "create" | "edit";
  onCancel     : () => void;
  onSubmit     : (values: Lokasi, autoGenerateKode: boolean) => Promise<void>;
};

export default function LokasiFormModal({
  initialValues,
  mode,
  onCancel,
  onSubmit,
}: LokasiFormModalProps) {
  const [values, setValues]             = useState<Lokasi>(initialValues);
  const [errors, setErrors]             = useState<LokasiFormErrors>({});
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleTextChange(field: keyof Lokasi) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const candidate: Lokasi = {
      ...values,
      kodelokasi: autoGenerate ? "" : values.kodelokasi,
    };
    const validationErrors = validateLokasiForm(candidate, { skipKodelokasi: autoGenerate });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(candidate, autoGenerate);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan lokasi");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {mode === "create" ? "Tambah Lokasi" : "Edit Lokasi"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi data toko, gudang, atau rak lokasi penyimpanan.
          </p>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {submitError}
          </p>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FormField error={errors.kodelokasi} htmlFor="kodelokasi" label="Kode Lokasi">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
              disabled={autoGenerate}
              id="kodelokasi"
              onChange={handleTextChange("kodelokasi")}
              placeholder={autoGenerate ? "Akan digenerate otomatis" : ""}
              type="text"
              value={autoGenerate ? "" : values.kodelokasi}
            />
            {mode === "create" && (
              <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  checked={autoGenerate}
                  onChange={(event) => setAutoGenerate(event.target.checked)}
                  type="checkbox"
                />
                Generate otomatis
              </label>
            )}
          </FormField>

          <FormField error={errors.namalokasi} htmlFor="namalokasi" label="Nama Lokasi">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              id="namalokasi"
              onChange={handleTextChange("namalokasi")}
              placeholder="Contoh: Gudang Utama / Toko Depan / Rak A1"
              type="text"
              value={values.namalokasi}
            />
          </FormField>

          <FormField error={errors.keterangan} htmlFor="keterangan" label="Keterangan / Deskripsi">
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              id="keterangan"
              onChange={handleTextChange("keterangan")}
              placeholder="Catatan atau fungsi lokasi ini..."
              rows={3}
              value={values.keterangan}
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
