"use client";

import { useState } from "react";

import { authClient, authErrorMessage } from "@/lib/client/auth";

type ResendVerificationButtonProps = {
  email: string;
};

export default function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError]   = useState<string | null>(null);

  async function handleClick() {
    setStatus("sending");
    setError(null);

    const { error: sendError } = await authClient.sendVerificationEmail({ email, callbackURL: "/verifikasi-email" });

    if (sendError) {
      setStatus("idle");
      setError(authErrorMessage(sendError, "Gagal mengirim ulang email verifikasi."));
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return <p className="mt-4 text-sm text-status-active-fg">Email verifikasi baru sudah dikirim.</p>;
  }

  return (
    <div className="mt-4">
      <button
        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "sending"}
        onClick={handleClick}
        type="button"
      >
        {status === "sending" ? "Mengirim..." : "Kirim Ulang Email Verifikasi"}
      </button>
      {error && <p className="mt-2 text-xs text-status-danger-fg">{error}</p>}
    </div>
  );
}
