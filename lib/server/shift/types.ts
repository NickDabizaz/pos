export type ShiftStatus = "OPEN" | "CLOSED";

export type PaymentMethod = "TUNAI" | "QRIS" | "TRANSFER";

export type Shift = {
  shiftCode         : string;
  kasirName         : string;
  modalAwal         : number;
  openedAt          : string;
  closedAt         ?: string;
  kasAktual        ?: number;
  catatan          ?: string;
  penjualanTunai    : number;
  penjualanNonTunai : number;
  jumlahTransaksi   : number;
  status            : ShiftStatus;
};

export type OpenShiftInput = {
  kasirName : string;
  modalAwal : number;
};

export type RecordShiftTransactionInput = {
  paymentMethod : PaymentMethod;
  grandTotal    : number;
};

export type CloseShiftInput = {
  kasAktual : number;
  catatan  ?: string;
};
