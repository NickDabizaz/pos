import type { Barang, BarangFormErrors } from "@/app/modules/master/barang/lib/types";

export type ValidateBarangFormOptions = {
  skipKodebarang?: boolean;
};

export function validateBarangForm(
  values: Barang,
  options: ValidateBarangFormOptions = {},
): BarangFormErrors {
  const errors: BarangFormErrors = {};

  if (!options.skipKodebarang && !values.kodebarang.trim()) {
    errors.kodebarang = "Kode barang wajib diisi";
  }
  if (!values.namabarang.trim()) errors.namabarang = "Nama barang wajib diisi";
  if (!values.kategori.trim()) errors.kategori = "Kategori wajib dipilih";
  if (!values.satuan.trim()) errors.satuan = "Satuan wajib diisi";
  validateNumericField(errors, "hargabeli", values.hargabeli, "Harga beli");
  validateNumericField(errors, "hargajual", values.hargajual, "Harga jual");
  validateNumericField(errors, "stok", values.stok, "Stok");

  return errors;
}

function validateNumericField(
  errors: BarangFormErrors,
  field: "hargabeli" | "hargajual" | "stok",
  value: number,
  label: string,
) {
  if (Number.isNaN(value)) {
    errors[field] = `${label} wajib diisi`;
  } else if (value < 0) {
    errors[field] = `${label} tidak boleh negatif`;
  }
}
