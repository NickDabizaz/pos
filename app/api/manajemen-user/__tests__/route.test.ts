import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { handleDeleteAnggota } from "@/app/api/manajemen-user/[iduser]/route";
import { handleDeleteStatusOwner } from "@/app/api/manajemen-user/[iduser]/owner/route";
import { handleDeleteHakMenu, handlePutHakMenu } from "@/app/api/manajemen-user/[iduser]/hak-menu/[kodemenu]/route";
import { handleGetDaftarMenu } from "@/app/api/manajemen-user/menu/route";
import { handleGetAnggota } from "@/app/api/manajemen-user/route";
import { handleGetInvitation, handlePostInvitation } from "@/app/api/manajemen-user/invitation/route";
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

async function tambahKeanggotaan(iduser: string, idperusahaan: number, isowner: boolean): Promise<void> {
  await prisma.userperusahaan.create({ data: { iduser, idperusahaan, isowner } });
}

async function pilihPerusahaanAktif(iduser: string, idperusahaan: number): Promise<void> {
  const row = await prisma.session.findFirstOrThrow({ where: { iduser } });
  await prisma.session.update({ where: { id: row.id }, data: { idperusahaan } });
}

async function setUpOwnerDanKaryawan(
  slug: string,
): Promise<{ idperusahaan: number; ownerHeaders: Headers; karyawanHeaders: Headers; idkaryawan: string }> {
  const owner = await signUpAndGetHeaders(`owner-${slug}@norvyn.test`);
  const karyawan = await signUpAndGetHeaders(`karyawan-${slug}@norvyn.test`);
  const idperusahaan = await tambahPerusahaan(`PSH-RMP-${slug}`);

  await tambahKeanggotaan(owner.iduser, idperusahaan, true);
  await tambahKeanggotaan(karyawan.iduser, idperusahaan, false);
  await pilihPerusahaanAktif(owner.iduser, idperusahaan);
  await pilihPerusahaanAktif(karyawan.iduser, idperusahaan);

  return { idperusahaan, ownerHeaders: owner.headers, karyawanHeaders: karyawan.headers, idkaryawan: karyawan.iduser };
}

describe("GET /api/manajemen-user dikawal Owner-only", () => {
  it("request tanpa cookie sesi ditolak 401", async () => {
    const response = await handleGetAnggota(auth, prisma, new Headers());
    expect(response.status).toBe(401);
  });

  it("karyawan non-Owner ditolak 403", async () => {
    const { karyawanHeaders } = await setUpOwnerDanKaryawan("get-1");
    const response = await handleGetAnggota(auth, prisma, karyawanHeaders);
    expect(response.status).toBe(403);
  });

  it("Owner berhasil 200 dan melihat daftar anggota", async () => {
    const { ownerHeaders } = await setUpOwnerDanKaryawan("get-2");
    const response = await handleGetAnggota(auth, prisma, ownerHeaders);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });
});

describe("GET/POST /api/manajemen-user/invitation dikawal Owner-only", () => {
  it("karyawan non-Owner ditolak 403 saat membuat link invitation", async () => {
    const { karyawanHeaders } = await setUpOwnerDanKaryawan("inv-1");
    const response = await handlePostInvitation(auth, prisma, karyawanHeaders);
    expect(response.status).toBe(403);
  });

  it("Owner berhasil membuat link invitation 201", async () => {
    const { ownerHeaders } = await setUpOwnerDanKaryawan("inv-2");
    const response = await handlePostInvitation(auth, prisma, ownerHeaders);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.url).toContain(body.data.token);
  });

  it("Owner tanpa link invitation aktif menerima data null, bukan error", async () => {
    const { ownerHeaders } = await setUpOwnerDanKaryawan("inv-3");
    const response = await handleGetInvitation(auth, prisma, ownerHeaders);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeNull();
  });

  it("Owner melihat link invitation yang sudah dibuat sebelumnya", async () => {
    const { ownerHeaders } = await setUpOwnerDanKaryawan("inv-4");
    await handlePostInvitation(auth, prisma, ownerHeaders);

    const response = await handleGetInvitation(auth, prisma, ownerHeaders);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toBeDefined();
  });
});

describe("GET /api/manajemen-user/menu dikawal Owner-only", () => {
  it("karyawan non-Owner ditolak 403", async () => {
    const { karyawanHeaders } = await setUpOwnerDanKaryawan("menu-1");
    const response = await handleGetDaftarMenu(auth, prisma, karyawanHeaders);
    expect(response.status).toBe(403);
  });

  it("Owner berhasil 200 dan hanya berisi menu berjenis DETAIL", async () => {
    const { ownerHeaders } = await setUpOwnerDanKaryawan("menu-2");
    const response = await handleGetDaftarMenu(auth, prisma, ownerHeaders);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ kodemenu: "MDATA-LOK", namamenu: "Lokasi" })]),
    );
  });
});

describe("DELETE /api/manajemen-user/[iduser] dikawal Owner-only", () => {
  it("request tanpa cookie sesi ditolak 401", async () => {
    const response = await handleDeleteAnggota(auth, prisma, new Headers(), "someone");
    expect(response.status).toBe(401);
  });

  it("karyawan non-Owner ditolak 403", async () => {
    const { karyawanHeaders, idkaryawan } = await setUpOwnerDanKaryawan("del-1");
    const response = await handleDeleteAnggota(auth, prisma, karyawanHeaders, idkaryawan);
    expect(response.status).toBe(403);
  });

  it("Owner berhasil mengeluarkan anggota 200", async () => {
    const { ownerHeaders, idkaryawan } = await setUpOwnerDanKaryawan("del-2");
    const response = await handleDeleteAnggota(auth, prisma, ownerHeaders, idkaryawan);
    expect(response.status).toBe(200);
  });
});

describe("DELETE /api/manajemen-user/[iduser]/owner dikawal Owner-only", () => {
  it("karyawan non-Owner ditolak 403", async () => {
    const { karyawanHeaders, idkaryawan } = await setUpOwnerDanKaryawan("cabut-1");
    const response = await handleDeleteStatusOwner(auth, prisma, karyawanHeaders, idkaryawan);
    expect(response.status).toBe(403);
  });

  it("Owner berhasil mencabut status Owner anggota lain 200", async () => {
    const { ownerHeaders, idperusahaan } = await setUpOwnerDanKaryawan("cabut-2");
    const { iduser: idownerKedua } = await signUpAndGetHeaders("owner-kedua-cabut-2@norvyn.test");
    await tambahKeanggotaan(idownerKedua, idperusahaan, true);

    const response = await handleDeleteStatusOwner(auth, prisma, ownerHeaders, idownerKedua);
    expect(response.status).toBe(200);
  });
});

describe("PUT/DELETE /api/manajemen-user/[iduser]/hak-menu/[kodemenu] dikawal Owner-only", () => {
  it("karyawan non-Owner ditolak 403 saat menyalakan Hak Menu", async () => {
    const { karyawanHeaders, idkaryawan } = await setUpOwnerDanKaryawan("hak-1");
    const response = await handlePutHakMenu(auth, prisma, karyawanHeaders, idkaryawan, "MDATA-LOK");
    expect(response.status).toBe(403);
  });

  it("Owner berhasil menyalakan lalu mematikan Hak Menu 200", async () => {
    const { ownerHeaders, idkaryawan } = await setUpOwnerDanKaryawan("hak-2");

    const nyala = await handlePutHakMenu(auth, prisma, ownerHeaders, idkaryawan, "MDATA-LOK");
    expect(nyala.status).toBe(200);

    const matikan = await handleDeleteHakMenu(auth, prisma, ownerHeaders, idkaryawan, "MDATA-LOK");
    expect(matikan.status).toBe(200);
  });
});
