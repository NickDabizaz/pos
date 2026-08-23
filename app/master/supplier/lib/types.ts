export type Supplier = {
  idsupplier  : number;
  kodesupplier: string;
  namasupplier: string;
  kontakperson: string;
  telepon     : string;
  email       : string;
  alamat      : string;
  status      : number;
};

export type SupplierFormErrors = {
  namasupplier?: string;
  kontakperson?: string;
  telepon     ?: string;
  email       ?: string;
  alamat      ?: string;
};
