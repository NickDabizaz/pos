export type ShiftStatus = "BELUM_DIBUKA" | "TERBUKA" | "TERTUTUP";

export type Shift = {
  status          : ShiftStatus;
  tanggal         : string;
  kodelokasi      : string;
  idkasir        ?: string;
  namakasir      ?: string;
  modalawal      ?: number;
  totaltunai     ?: number;
  totalnontunai  ?: number;
  jumlahtransaksi?: number;
  kasaktual      ?: number;
  selisih        ?: number;
  catatan        ?: string | null;
};

export type ShiftStatusInput = {
  tanggal   : string;
  kodelokasi: string;
};

export type OpenShiftInput = {
  tanggal   : string;
  kodelokasi: string;
  idkasir   : string;
  modalawal : number;
};

export type CloseShiftInput = {
  tanggal   : string;
  kodelokasi: string;
  kasaktual : number;
  catatan  ?: string;
};

export type CancelCloseShiftInput = {
  tanggal   : string;
  kodelokasi: string;
};
