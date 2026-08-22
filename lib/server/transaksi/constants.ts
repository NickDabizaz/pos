export const DEFAULT_TRANSACTION_DATE_OFFSET_DAYS = 3;

export function getDefaultTransactionDate(referenceDate: Date = new Date()): string {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() - DEFAULT_TRANSACTION_DATE_OFFSET_DAYS);
  const formatted = date.toISOString().slice(0, 10);

  return formatted;
}
