import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { handlePostGabungInvitation } from "@/app/api/invitation/[token]/gabung/route";
import { buatInvitation } from "@/lib/server/invitation/service";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

const SESSION_COOKIE_NAME = "better-auth.session_token";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
  auth = createAuth(prisma);
}, 60_000);

afterAll(async () => {
  await tearDown();
});

function sessionHeadersFrom(headers: Headers): Headers {
  const sessionCookie = parseSetCookieHeader(headers.get("set-cookie") ?? "").get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    throw new Error("Response tidak memuat cookie sesi");
  }
  return new Headers({ cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` });
}

async function signUpAndGetHeaders(email: string): Promise<{ headers: Headers; iduser: string }> {
  const { headers, response } = await auth.api.signUpEmail({
    body         : { email, name: email, password: "RahasiaAman123" },
    returnHeaders: true,
  });
  return { headers: sessionHeadersFrom(headers), iduser: response.user.id };
}

async function tambahPerusahaan(kodeperusahaan: string): Promise<number> {
  const perusahaan = await prisma.perusahaan.create({
    data: { kodeperusahaan, namaperusahaan: `Toko ${kodeperusahaan}`, namadatabase: `pos_test_${kodeperusahaan.toLowerCase()}`, status: 1 },
  });
  return perusahaan.idperusahaan;
}

describe("POST /api/invitation/[token]/gabung", () => {
  it("request tanpa cookie sesi ditolak 401", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-GABUNG-1");
    const invitation = await buatInvitation(prisma, idperusahaan);

    const response = await handlePostGabungInvitation(auth, prisma, new Headers(), invitation.token);
    expect(response.status).toBe(401);
  });

  it("token tidak dikenal ditolak 404", async () => {
    const { headers } = await signUpAndGetHeaders("gabung-2@norvyn.test");

    const response = await handlePostGabungInvitation(auth, prisma, headers, "token-tidak-ada");
    expect(response.status).toBe(404);
  });

  it("token sudah kedaluwarsa ditolak 410", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-GABUNG-3");
    const invitation = await buatInvitation(prisma, idperusahaan);
    await prisma.invitationperusahaan.update({ where: { token: invitation.token }, data: { expiresat: new Date(Date.now() - 1000) } });
    const { headers } = await signUpAndGetHeaders("gabung-3@norvyn.test");

    const response = await handlePostGabungInvitation(auth, prisma, headers, invitation.token);
    expect(response.status).toBe(410);
  });

  it("Pengguna dengan sesi valid berhasil bergabung 200 dan tercatat non-Owner", async () => {
    const idperusahaan = await tambahPerusahaan("PSH-GABUNG-4");
    const invitation = await buatInvitation(prisma, idperusahaan);
    const { headers, iduser } = await signUpAndGetHeaders("gabung-4@norvyn.test");

    const response = await handlePostGabungInvitation(auth, prisma, headers, invitation.token);
    expect(response.status).toBe(200);

    const membership = await prisma.userperusahaan.findUniqueOrThrow({
      where: { iduser_idperusahaan: { iduser, idperusahaan } },
    });
    expect(membership.isowner).toBe(false);
  });
});
