export type Supplier = {
  idsupplier  : number;
  kodesupplier: string;
  namasupplier: string;
  kontakperson: string | null;
  telepon     : string | null;
  email       : string | null;
  alamat      : string | null;
  status      : number;
};

export type CreateSupplierInput = {
  namasupplier: string;
  kontakperson?: string | null;
  telepon?    : string | null;
  email?      : string | null;
  alamat?     : string | null;
};

export type UpdateSupplierInput = {
  namasupplier?: string;
  kontakperson?: string | null;
  telepon?     : string | null;
  email?       : string | null;
  alamat?      : string | null;
  status?      : 0 | 1;
};
