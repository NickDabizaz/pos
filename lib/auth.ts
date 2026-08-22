import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import type { GoogleOptions } from "@better-auth/core/social-providers";

import { prisma } from "@/lib/prisma";
import { createMailer } from "@/lib/server/mailer/service";
import { tautanEmailTemplate } from "@/lib/server/mailer/template";
import type { Mailer } from "@/lib/server/mailer/types";
import type { PrismaClient } from "@/lib/generated/prisma-global/client";

const TOKEN_EXPIRES_IN_DETIK = 60 * 60;

export type AuthDeps = {
  mailer?: Mailer;
  googleProvider?: Pick<Partial<GoogleOptions>, "verifyIdToken" | "getUserInfo">;
};

async function kirimEmailTautan(
  mailer     : Mailer,
  to         : string,
  subject    : string,
  heading    : string,
  ajakan     : string,
  buttonLabel: string,
  url        : string,
  token      : string,
): Promise<void> {
  await mailer.send({
    to,
    subject,
    html: tautanEmailTemplate({
      heading,
      ajakan,
      buttonLabel,
      url,
      token,
      catatanKaki: "Tautan ini berlaku selama 1 jam. Abaikan email ini kalau Anda tidak meminta ini.",
    }),
  });
}

export function createAuth(client: PrismaClient, deps: AuthDeps = {}) {
  const mailer = deps.mailer ?? createMailer();

  return betterAuth({
    database        : prismaAdapter(client, {
      provider: "mysql",
    }),
    emailAndPassword: {
      enabled                    : true,
      resetPasswordTokenExpiresIn: TOKEN_EXPIRES_IN_DETIK,
      sendResetPassword          : async ({ user, url, token }) => {
        await kirimEmailTautan(
          mailer,
          user.email,
          "Reset password akun Anda",
          "Reset Password",
          "Kami menerima permintaan untuk mengatur ulang password akun Anda. Klik tombol di bawah untuk membuat password baru.",
          "Atur Ulang Password",
          url,
          token,
        );
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        await kirimEmailTautan(
          mailer,
          user.email,
          "Verifikasi email Anda",
          "Verifikasi Email Anda",
          "Terima kasih sudah mendaftar. Klik tombol di bawah untuk memverifikasi alamat email Anda.",
          "Verifikasi Email",
          url,
          token,
        );
      },
      sendOnSignUp: true,
      expiresIn   : TOKEN_EXPIRES_IN_DETIK,
    },
    socialProviders: {
      google: {
        clientId    : process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        ...deps.googleProvider,
      },
    },
    baseURL         : process.env.BETTER_AUTH_URL,
    secret          : process.env.BETTER_AUTH_SECRET,
    session         : {
      fields: { userId: "iduser" },
    },
    account         : {
      fields: { userId: "iduser" },
    },
  });
}

export const auth = createAuth(prisma);
