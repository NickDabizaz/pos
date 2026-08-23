import type { GlobalClient, InvitationRow } from "@/lib/server/invitation/types";

function toRow(invitation: {
  token       : string;
  idperusahaan: number;
  expiresat   : Date;
  perusahaan  : { namaperusahaan: string };
}): InvitationRow {
  const row = {
    token         : invitation.token,
    idperusahaan  : invitation.idperusahaan,
    namaperusahaan: invitation.perusahaan.namaperusahaan,
    expiresat     : invitation.expiresat,
  };

  return row;
}

export async function findInvitationByPerusahaan(db: GlobalClient, idperusahaan: number): Promise<InvitationRow | null> {
  const invitation = await db.invitationperusahaan.findUnique({
    where  : { idperusahaan },
    include: { perusahaan: { select: { namaperusahaan: true } } },
  });

  return invitation ? toRow(invitation) : null;
}

export async function findInvitationByToken(db: GlobalClient, token: string): Promise<InvitationRow | null> {
  const invitation = await db.invitationperusahaan.findUnique({
    where  : { token },
    include: { perusahaan: { select: { namaperusahaan: true } } },
  });

  return invitation ? toRow(invitation) : null;
}

export async function upsertInvitation(
  db          : GlobalClient,
  idperusahaan: number,
  token       : string,
  expiresat   : Date,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.invitationperusahaan.deleteMany({ where: { idperusahaan } });
    await tx.invitationperusahaan.create({ data: { token, idperusahaan, expiresat } });
  });
}
