import dns from "node:dns";

import nodemailer from "nodemailer";

import type { EmailMessage, Mailer } from "@/lib/server/mailer/types";

dns.setDefaultResultOrder("ipv4first");

export function createMailer(): Mailer {
  const transporter = nodemailer.createTransport({
    host  : process.env.SMTP_HOST,
    port  : Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth  : process.env.SMTP_USER
      ? {
        user: process.env.SMTP_USER,
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
        console.error("[mailer] Gagal mengirim email:", error);
        throw error;
      }
    },
  };
}
