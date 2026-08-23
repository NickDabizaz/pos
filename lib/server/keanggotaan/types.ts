import type { GlobalClient } from "@/lib/server/user/types";

export type { GlobalClient };

export type AnggotaRow = {
  iduser : string;
  email  : string;
  name   : string;
  isowner: boolean;
};

export type KeluarkanAnggotaInput = {
  idpemanggil : string;
  idusertarget: string;
  idperusahaan: number;
};

export type CabutStatusOwnerInput = {
  idpemanggil : string;
  idusertarget: string;
  idperusahaan: number;
};
