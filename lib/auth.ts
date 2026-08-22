import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import type { GoogleOptions } from "@better-auth/core/social-providers";

import { prisma } from "@/lib/prisma";
import { createMailer } from "@/lib/server/mailer/service";
import { tautanEmailTemplate } from "@/lib/server/mailer/template";
import type { Mailer } from "@/lib/server/mailer/types";
import type { PrismaClient } from "@/lib/generated/prisma-global/client";

/** Durasi berlaku tautan verifikasi email maupun reset password — lihat catatan asumsi tiket 05. */
const TOKEN_EXPIRES_IN_DETIK = 60 * 60;

export type AuthDeps = {
  mailer?: Mailer;
  /**
   * Override `verifyIdToken`/`getUserInfo` provider Google — dipakai test supaya tidak
   * memanggil Google sungguhan (lihat catatan seam tiket 06). Kosong berarti pakai
   * implementasi asli Better Auth terhadap Google.
   */
  googleProvider?: Pick<Partial<GoogleOptions>, "verifyIdToken" | "getUserInfo">;
};

/** Mengirim satu email bertautan token (verifikasi email atau reset password) lewat `mailer`,
 * dirender dari {@link tautanEmailTemplate}. */
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

/**
 * Membangun instance Better Auth di atas client Database Global yang diberikan. Diekspor
 * terpisah dari `auth` supaya test bisa menunjuknya ke Database Global test yang berbeda,
 * tanpa menyentuh koneksi produksi. `deps` membolehkan test menyuntik mailer palsu dan
 * provider Google palsu (lihat `AuthDeps`).
 */
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
    // Catatan: verifyEmail bawaan Better Auth idempoten saat token dipakai ulang (mengembalikan
    // status sukses tanpa efek samping tambahan, bukan melempar error) — bukan "menghapus baris
    // terpakai" seperti reset-password. Properti keamanannya (tidak ada efek samping ganda)
    // tetap terjaga; lihat lib/__tests__/emailVerification.test.ts untuk skenario ini.
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
    // Catatan: default Better Auth (account.accountLinking.requireLocalEmailVerified = true)
    // menolak penautan akun Google ke akun email+password yang emailnya belum terverifikasi —
    // ini sengaja dibiarkan (bukan dilonggarkan lewat requireLocalEmailVerified: false) karena
    // melonggarkannya membuka celah account-takeover: penyerang bisa mendaftar duluan dengan
    // email korban yang belum ia verifikasi, lalu korban yang masuk lewat Google dengan email
    // asli malah tertaut ke akun buatan penyerang. Konsekuensinya, penautan Google (tiket 06)
    // baru berhasil setelah Pengguna memverifikasi emailnya (tiket 05) lebih dulu.
    socialProviders: {
      google: {
        clientId    : process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        ...deps.googleProvider,
      },
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
