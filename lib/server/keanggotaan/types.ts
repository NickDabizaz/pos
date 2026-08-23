import type { GlobalClient } from "@/lib/server/user/types";

export type { GlobalClient };

export type KandidatAnggota = {
  iduser: string;
  email : string;
  name  : string;
};

export type TambahAnggotaInput = {
  idpemanggil : string;
  idusertarget: string;
  idperusahaan: number;
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
