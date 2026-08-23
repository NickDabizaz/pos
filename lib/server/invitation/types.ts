import type { GlobalClient } from "@/lib/server/perusahaan/types";

export type { GlobalClient };

export type InvitationRow = {
  token         : string;
  idperusahaan  : number;
  namaperusahaan: string;
  expiresat     : Date;
};

export type InvitationResult = {
  token: string;
  url  : string;
};

export type GabungViaInvitationInput = {
  token : string;
  iduser: string;
  idsesi: string;
};
