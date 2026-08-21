import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { resolveDaftarPerusahaanAccess, resolveSudahPunyaPerusahaanAccess } from "@/lib/server/auth/guard";
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

async function redirectTargetOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    throw new Error("Diharapkan melempar redirect, tapi tidak melempar apa pun");
  } catch (error) {
    const digest = (error as { digest?: string }).digest;
    if (!digest || !digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    return digest.split(";")[2];
  }
}

describe("Pengarahan setelah login", () => {
  it("Pengguna yang belum memiliki Keanggotaan diarahkan ke form pendaftaran Perusahaan (tidak melempar redirect)", async () => {
    const { headers } = await signUpAndGetHeaders("belum-punya-perusahaan@norvyn.test");

    const session = await resolveDaftarPerusahaanAccess(auth, prisma, headers);

    expect(session.user.email).toBe("belum-punya-perusahaan@norvyn.test");
  });

  it("Pengguna yang sudah memiliki Keanggotaan tidak diarahkan ke form pendaftaran (dilempar ke /)", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("sudah-punya-perusahaan@norvyn.test");
    const perusahaan = await prisma.perusahaan.create({
      data: { kodeperusahaan: "PSH-GUARD-1", namaperusahaan: "Toko Guard", namadatabase: "pos_test_guard_1" },
    });
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });

    const target = await redirectTargetOf(resolveDaftarPerusahaanAccess(auth, prisma, headers));

    expect(target).toBe("/");
  });

  it("permintaan tanpa sesi login diarahkan ke halaman login dan tidak pernah sampai ke pendaftaran Perusahaan", async () => {
    const target = await redirectTargetOf(resolveDaftarPerusahaanAccess(auth, prisma, new Headers()));

    expect(target).toBe("/login");
  });
});

describe("Pengarahan ke halaman yang mensyaratkan Perusahaan aktif (mis. /)", () => {
  it("Pengguna yang belum memiliki Keanggotaan diarahkan ke /daftar-perusahaan", async () => {
    const { headers } = await signUpAndGetHeaders("belum-punya-perusahaan-beranda@norvyn.test");

    const target = await redirectTargetOf(resolveSudahPunyaPerusahaanAccess(auth, prisma, headers));

    expect(target).toBe("/daftar-perusahaan");
  });

  it("Pengguna yang sudah memiliki Keanggotaan tidak diarahkan (tidak melempar redirect)", async () => {
    const { headers, iduser } = await signUpAndGetHeaders("sudah-punya-perusahaan-beranda@norvyn.test");
    const perusahaan = await prisma.perusahaan.create({
      data: { kodeperusahaan: "PSH-GUARD-2", namaperusahaan: "Toko Guard Beranda", namadatabase: "pos_test_guard_2" },
    });
    await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });

    const session = await resolveSudahPunyaPerusahaanAccess(auth, prisma, headers);

    expect(session.user.email).toBe("sudah-punya-perusahaan-beranda@norvyn.test");
  });

  it("permintaan tanpa sesi login diarahkan ke halaman login, bukan ke /daftar-perusahaan", async () => {
    const target = await redirectTargetOf(resolveSudahPunyaPerusahaanAccess(auth, prisma, new Headers()));

    expect(target).toBe("/login");
  });
});
