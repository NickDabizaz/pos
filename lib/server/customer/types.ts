export type Customer = {
  idcustomer  : number;
  kodecustomer: string;
  namacustomer: string;
  telepon     : string | null;
  email       : string | null;
  alamat      : string | null;
  status      : number;
};

export type CreateCustomerInput = {
  namacustomer: string;
  telepon?    : string | null;
  email?      : string | null;
  alamat?     : string | null;
};

export type UpdateCustomerInput = {
  namacustomer?: string;
  telepon?     : string | null;
  email?       : string | null;
  alamat?      : string | null;
  status?      : 0 | 1;
};
