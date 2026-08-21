export type DaftarPerusahaanFormValues = {
  namaperusahaan: string;
  generateKode  : boolean;
  kodeperusahaan: string;
};

export type DaftarPerusahaanFormErrors = Partial<Record<"namaperusahaan" | "kodeperusahaan", string>>;

export function validateDaftarPerusahaanForm(values: DaftarPerusahaanFormValues): DaftarPerusahaanFormErrors {
  const errors: DaftarPerusahaanFormErrors = {};

  if (!values.namaperusahaan.trim()) {
    errors.namaperusahaan = "Nama Perusahaan wajib diisi";
  }

  if (!values.generateKode && !values.kodeperusahaan.trim()) {
    errors.kodeperusahaan = "Kode Perusahaan wajib diisi";
  }

  return errors;
}
