import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSetCookieHeader } from "better-auth/cookies";

import { createAuth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { findSession } from "@/lib/server/auth/service";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

const SESSION_COOKIE_NAME = "better-auth.session_token";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
  auth = createAuth(prisma);

  const { headers } = await auth.api.signUpEmail({
    body         : { email: "penjaga@norvyn.test", name: "Penjaga", password: "RahasiaAman123" },
    returnHeaders: true,
  });
  signedInHeaders = sessionHeadersFrom(headers);
}, 60_000);

afterAll(async () => {
  await tearDown();
});

let signedInHeaders: Headers;

function sessionHeadersFrom(headers: Headers): Headers {
  const sessionCookie = parseSetCookieHeader(headers.get("set-cookie") ?? "").get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    throw new Error("Response tidak memuat cookie sesi");
  }
  return new Headers({ cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` });
}

describe("Permintaan yang membawa cookie sesi yang sah dikenali sebagai sudah login", () => {
  it("findSession mengembalikan Pengguna untuk header yang memuat cookie sesi hasil login", async () => {
    const session = await findSession(auth, signedInHeaders);

    expect(session?.user.email).toBe("penjaga@norvyn.test");
  });

  it("findSession dipanggil dua kali dengan cookie sesi yang sama tetap mengembalikan Pengguna yang sama", async () => {
    const pertama = await findSession(auth, signedInHeaders);
    const kedua = await findSession(auth, signedInHeaders);

    expect(pertama?.user.email).toBe("penjaga@norvyn.test");
    expect(kedua?.user.email).toBe("penjaga@norvyn.test");
  });
});

describe("Permintaan tanpa sesi yang sah dikenali sebagai belum login", () => {
  it("findSession mengembalikan null untuk header tanpa cookie apa pun", async () => {
    expect(await findSession(auth, new Headers())).toBeNull();
  });

  it("findSession mengembalikan null untuk cookie sesi yang tidak dikenal", async () => {
    const headers = new Headers({ cookie: `${SESSION_COOKIE_NAME}=token-palsu-yang-tidak-pernah-diterbitkan` });

    expect(await findSession(auth, headers)).toBeNull();
  });

  it("findSession mengembalikan null setelah Pengguna logout dengan cookie sesi yang sama", async () => {
    const { headers } = await auth.api.signUpEmail({
      body         : { email: "logoutguard@norvyn.test", name: "Logout Guard", password: "RahasiaAman123" },
      returnHeaders: true,
    });
    const sessionHeaders = sessionHeadersFrom(headers);

    expect(await findSession(auth, sessionHeaders)).not.toBeNull();

    await auth.api.signOut({ headers: sessionHeaders });

    expect(await findSession(auth, sessionHeaders)).toBeNull();
  });
});
