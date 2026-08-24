import type { Barang } from "@/lib/server/barang/types";
import type { Shift } from "@/lib/server/shift/types";

export type { Barang };
export type { Shift as ShiftSession };
export type PaymentMethod = "TUNAI" | "QRIS" | "TRANSFER";

export type CartItem = {
  barang : Barang;
  qty    : number;
  note  ?: string;
};

export type TransactionSummary = {
  amountPaid    : number;
  change        : number;
  date          : Date;
  discount      : number;
  grandTotal    : number;
  id            : string;
  invoiceNumber : string;
  items         : CartItem[];
  kasirName     : string;
  paymentMethod : PaymentMethod;
  subtotal      : number;
};

export type ProductCategory = {
  icon ?: string;
  id    : string;
  name  : string;
};
