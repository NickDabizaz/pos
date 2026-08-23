import { parseResponse } from "@/lib/client/apiResponse";

export type Invitation = {
  token: string;
  url  : string;
};

export async function fetchInvitationAktif(): Promise<Invitation | null> {
  const response = await fetch("/api/manajemen-user/invitation", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Invitation | null>(response)) ?? null;
}

export async function buatInvitation(): Promise<Invitation> {
  const response = await fetch("/api/manajemen-user/invitation", {
    method: "POST",
  });

  return await parseResponse<Invitation>(response);
}

export async function gabungViaInvitation(token: string): Promise<void> {
  const response = await fetch(`/api/invitation/${token}/gabung`, {
    method: "POST",
  });

  await parseResponse<undefined>(response);
}
