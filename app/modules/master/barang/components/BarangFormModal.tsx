import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import type { Barang, BarangFormErrors } from "@/app/modules/master/barang/lib/types";
import { validateBarangForm } from "@/app/modules/master/barang/lib/validateBarangForm";

type BarangFormModalProps = {
  initialValues  : Barang;
  kategoriOptions: string[];
  mode           : "create" | "edit";
  onCancel       : () => void;
  onSubmit       : (values: Barang, autoGenerateKode: boolean) => Promise<void>;
};

type NumericField = "hargabeli" | "hargajual" | "stok";

export default function BarangFormModal({
  initialValues,
  kategoriOptions,
  mode,
  onCancel,
  onSubmit,
}: BarangFormModalProps) {
  const [values, setValues]             = useState<Barang>(initialValues);
  const [errors, setErrors]             = useState<BarangFormErrors>({});
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleTextChange(field: keyof Barang) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }));
    };
  }

  function handleNumberChange(field: NumericField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const parsed = raw.trim() === "" ? NaN : Number(raw);
      setValues((previous) => ({ ...previous, [field]: parsed }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const candidate: Barang = { ...values, kodebarang: autoGenerate ? "" : values.kodebarang };
    const validationErrors = validateBarangForm(candidate, { skipKodebarang: autoGenerate });

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
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan barang");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {mode === "create" ? "Tambah Barang" : "Edit Barang"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi data barang di bawah ini.
          </p>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {submitError}
          </p>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FormField error={errors.kodebarang} htmlFor="kodebarang" label="Kode Barang">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
              disabled={autoGenerate}
              id="kodebarang"
              onChange={handleTextChange("kodebarang")}
              placeholder={autoGenerate ? "Akan digenerate otomatis" : ""}
              type="text"
              value={autoGenerate ? "" : values.kodebarang}
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

          <FormField error={errors.namabarang} htmlFor="namabarang" label="Nama Barang">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              id="namabarang"
              onChange={handleTextChange("namabarang")}
              type="text"
              value={values.namabarang}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField error={errors.kategori} htmlFor="kategori" label="Kategori">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                id="kategori"
                onChange={handleTextChange("kategori")}
                value={values.kategori}
              >
                <option value="">Pilih kategori</option>
                {kategoriOptions.map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField error={errors.satuan} htmlFor="satuan" label="Satuan">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                id="satuan"
                onChange={handleTextChange("satuan")}
                type="text"
                value={values.satuan}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField error={errors.hargabeli} htmlFor="hargabeli" label="Harga Beli">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                id="hargabeli"
                min={0}
                onChange={handleNumberChange("hargabeli")}
                type="number"
                value={Number.isNaN(values.hargabeli) ? "" : values.hargabeli}
              />
            </FormField>

            <FormField error={errors.hargajual} htmlFor="hargajual" label="Harga Jual">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                id="hargajual"
                min={0}
                onChange={handleNumberChange("hargajual")}
                type="number"
                value={Number.isNaN(values.hargajual) ? "" : values.hargajual}
              />
            </FormField>

            <FormField error={errors.stok} htmlFor="stok" label="Stok">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                id="stok"
                min={0}
                onChange={handleNumberChange("stok")}
                type="number"
                value={Number.isNaN(values.stok) ? "" : values.stok}
              />
            </FormField>
          </div>

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
