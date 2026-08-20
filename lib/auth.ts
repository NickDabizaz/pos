import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma-global/client";

/**
 * Membangun instance Better Auth di atas client Database Global yang diberikan. Diekspor
 * terpisah dari `auth` supaya test bisa menunjuknya ke Database Global test yang berbeda,
 * tanpa menyentuh koneksi produksi.
 */
export function createAuth(client: PrismaClient) {
  return betterAuth({
    database        : prismaAdapter(client, {
      provider: "mysql",
    }),
    emailAndPassword: {
      enabled: true,
    },
    baseURL         : process.env.BETTER_AUTH_URL,
    secret          : process.env.BETTER_AUTH_SECRET,
    // Menyamakan nama FK Pengguna di tabel session/account dengan konvensi tabel domain
    // lain (usermenu.iduser, userperusahaan.iduser) — lihat komentar di auth.prisma.
    session         : {
      fields: { userId: "iduser" },
    },
    account         : {
      fields: { userId: "iduser" },
    },
  });
}

export const auth = createAuth(prisma);
