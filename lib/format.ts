/**
 * Formats a numeric value into Indonesian Rupiah currency string.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    currency            : "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style               : "currency",
  }).format(amount);
}
