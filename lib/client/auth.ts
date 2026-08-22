import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD             : "Email atau password salah",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL : "Email sudah terdaftar. Gunakan email lain.",
};

export function authErrorMessage(error: { code?: string; message?: string } | null | undefined, fallback: string): string {
  if (!error) {
    return fallback;
  }

  return (error.code && ERROR_MESSAGES[error.code]) || error.message || fallback;
}
