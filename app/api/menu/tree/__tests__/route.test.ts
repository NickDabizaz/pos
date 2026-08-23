import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { handleGetMenuTree } from "@/app/api/menu/tree/route";
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

async function tambahPerusahaan(kodeperusahaan: string, status = 1): Promise<number> {
  const perusahaan = await prisma.perusahaan.create({
    data: { kodeperusahaan, namaperusahaan: `Toko ${kodeperusahaan}`, namadatabase: `pos_test_${kodeperusahaan.toLowerCase()}`, status },
  });

  if (status === 1) {
    const tglmulai = new Date();
    const tglselesai = new Date(tglmulai);
    tglselesai.setUTCDate(tglselesai.getUTCDate() + 30);
    await prisma.subscription.create({
      data: {
        idperusahaan   : perusahaan.idperusahaan,
        orderid        : `TEST-${kodeperusahaan}`,
        namapaket      : "Paket Bulanan",
        hargapaket     : 150_000,
        masaberlakuhari: 30,
        tglmulai,
        tglselesai,
      },
    });
  }

  return perusahaan.idperusahaan;
}

async function tambahKeanggotaan(iduser: string, idperusahaan: number, isowner: boolean): Promise<void> {
  await prisma.userperusahaan.create({ data: { iduser, idperusahaan, isowner } });
}

async function pilihPerusahaanAktif(iduser: string, idperusahaan: number): Promise<void> {
  const row = await prisma.session.findFirstOrThrow({ where: { iduser } });
  await prisma.session.update({ where: { id: row.id }, data: { idperusahaan } });
}

describe("GET /api/menu/tree dikawal end-to-end", () => {
  it("request tanpa cookie sesi ditolak 401, tidak memuat data menu", async () => {
    const response = await handleGetMenuTree(auth, prisma, new Headers());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.data).toBeUndefined();
  });

  it("sesi valid tapi Perusahaan Aktif belum bayar (status 0) ditolak 403, bukan 200", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("route-menu-belum-bayar@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-ROUTE-1", 0);
    await tambahKeanggotaan(iduser, idperusahaan, true);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const response = await handleGetMenuTree(auth, prisma, headers);

    expect(response.status).toBe(403);
  });

  it("karyawan tanpa Hak Menu untuk menu yang dipetakan ke rute ini ditolak 403, dipanggil langsung tanpa lewat UI", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("route-menu-tanpa-hak@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-ROUTE-2", 1);
    await tambahKeanggotaan(iduser, idperusahaan, false);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const response = await handleGetMenuTree(auth, prisma, headers);

    expect(response.status).toBe(403);
  });

  it("Owner tanpa satu pun baris Hak Menu, dengan Langganan aktif: 200 berisi data menu", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("route-menu-owner@norvyn.test");
    const idperusahaan = await tambahPerusahaan("PSH-ROUTE-3", 1);
    await tambahKeanggotaan(iduser, idperusahaan, true);
    await pilihPerusahaanAktif(iduser, idperusahaan);

    const response = await handleGetMenuTree(auth, prisma, headers);
    const body = await response.json();

    expect(response.status).toBe(200);
    const master = body.data.find((node: { kodemenu: string }) => node.kodemenu === "MDATA");
    expect(master.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ kodemenu: "MDATA-LOK", namamenu: "Lokasi" })]),
    );
  });
});
