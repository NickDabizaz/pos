import { randomBytes } from "node:crypto";

import { insertMembership, isKonflikMembership } from "@/lib/server/keanggotaan/repository";
import { setSessionPerusahaanAktif } from "@/lib/server/perusahaan/repository";
import { findInvitationByPerusahaan, findInvitationByToken, upsertInvitation } from "@/lib/server/invitation/repository";
import type { GabungViaInvitationInput, GlobalClient, InvitationResult, InvitationRow } from "@/lib/server/invitation/types";

const INVITATION_EXPIRES_IN_HARI = 7;
const TOKEN_BYTES = 32;

function toInvitationUrl(token: string): string {
  const url = `${process.env.BETTER_AUTH_URL}/invitation/${token}`;

  return url;
}

export async function buatInvitation(db: GlobalClient, idperusahaan: number): Promise<InvitationResult> {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const expiresat = new Date(Date.now() + INVITATION_EXPIRES_IN_HARI * 24 * 60 * 60 * 1000);

  await upsertInvitation(db, idperusahaan, token, expiresat);

  return { token, url: toInvitationUrl(token) };
}

export async function findInvitationAktif(db: GlobalClient, idperusahaan: number): Promise<InvitationResult | null> {
  const invitation = await findInvitationByPerusahaan(db, idperusahaan);
  if (!invitation || invitation.expiresat < new Date()) {
    return null;
  }

  return { token: invitation.token, url: toInvitationUrl(invitation.token) };
}

export async function cekInvitationBerlaku(db: GlobalClient, token: string): Promise<InvitationRow> {
  const invitation = await findInvitationByToken(db, token);
  if (!invitation) {
    throw new Error("Link invitation tidak ditemukan", { cause: "INVITATION_TIDAK_DITEMUKAN" });
  }
  if (invitation.expiresat < new Date()) {
    throw new Error("Link invitation sudah kedaluwarsa", { cause: "INVITATION_KADALUARSA" });
  }

  return invitation;
}

export async function gabungViaInvitation(db: GlobalClient, input: GabungViaInvitationInput): Promise<number> {
  const invitation = await cekInvitationBerlaku(db, input.token);

  try {
    await insertMembership(db, input.iduser, invitation.idperusahaan);
  } catch (error) {
    if (!isKonflikMembership(error)) {
      throw error;
    }
  }

  await setSessionPerusahaanAktif(db, input.idsesi, invitation.idperusahaan);

  return invitation.idperusahaan;
}
