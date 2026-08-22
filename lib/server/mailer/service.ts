import nodemailer from "nodemailer";

import type { EmailMessage, Mailer } from "@/lib/server/mailer/types";

/** Mailer produksi lewat SMTP — kredensial dibaca dari environment, tidak pernah tertulis di kode. */
export function createMailer(): Mailer {
  const transporter = nodemailer.createTransport({
    host  : process.env.SMTP_HOST,
    port  : Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth  : process.env.SMTP_USER
      ? {
        user: process.env.SMTP_USER,
        // App password Gmail biasanya disalin dengan spasi pemisah ("abcd efgh ijkl mnop") —
        // spasi itu bukan bagian dari password sesungguhnya dan harus dibuang, kalau tidak
        // autentikasi SMTP gagal secara diam-diam (lihat komentar di send() di bawah).
        pass: process.env.SMTP_PASSWORD?.replace(/\s+/g, ""),
      }
      : undefined,
  });

  return {
    async send({ to, subject, html }: EmailMessage): Promise<void> {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
          to,
          subject,
          html,
        });
      } catch (error) {
        // Better Auth menjalankan sendVerificationEmail/sendResetPassword lewat
        // runInBackgroundOrAwait, yang menelan error ini jadi cuma log — tanpa log eksplisit
        // di sini, kegagalan SMTP (kredensial salah, From tidak diizinkan provider, dst.)
        // terlihat seperti "berhasil" padahal emailnya tidak pernah terkirim.
        console.error("[mailer] Gagal mengirim email:", error);
        throw error;
      }
    },
  };
}
