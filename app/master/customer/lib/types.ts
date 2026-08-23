export type Customer = {
  idcustomer  : number;
  kodecustomer: string;
  namacustomer: string;
  telepon     : string;
  email       : string;
  alamat      : string;
  status      : number;
};

export type CustomerFormErrors = {
  namacustomer?: string;
  telepon     ?: string;
  email       ?: string;
  alamat      ?: string;
};
