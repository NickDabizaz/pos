import type { Barang } from "@/lib/server/barang/types";

export type { Barang };

export type ShiftSession = {
  isOpen    : boolean;
  kasirName : string;
  modalAwal : number;
  openedAt  : Date;
  shiftCode : string;
};

export type CartItem = {
  barang : Barang;
  qty    : number;
  note  ?: string;
};

export type PaymentMethod = "TUNAI" | "QRIS" | "TRANSFER";

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
