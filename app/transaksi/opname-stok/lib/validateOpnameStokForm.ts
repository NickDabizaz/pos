import type { OpnameStokFormErrors, OpnameStokFormValues } from "@/app/transaksi/opname-stok/lib/types";

function hariIniIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateOpnameStokForm(values: OpnameStokFormValues): OpnameStokFormErrors {
  const errors: OpnameStokFormErrors = {};

  if (!values.tanggal.trim()) {
    errors.tanggal = "Tanggal wajib diisi";
  } else if (values.tanggal > hariIniIso()) {
    errors.tanggal = "Tanggal tidak boleh setelah hari ini";
  }

  if (!values.kodelokasi.trim()) {
    errors.kodelokasi = "Lokasi wajib dipilih";
  }

  if (values.rows.length === 0) {
    errors.rows = "Muat daftar barang terlebih dahulu, minimal 1 baris";
  } else if (values.rows.some((row) => !(row.jmlfisik >= 0))) {
    errors.rows = "Jumlah fisik tidak boleh negatif";
  } else if (values.rows.some((row) => !row.kodebarang.trim())) {
    errors.rows = "Setiap baris harus menunjuk barang";
  }

  return errors;
}
