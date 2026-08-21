import type { auth } from "@/lib/auth";

export type AuthInstance = typeof auth;

export type UserSession = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;

/**
 * Membaca sesi milik satu permintaan dari header-nya, atau `null` kalau belum login.
 * Instance Better Auth dilewatkan sebagai parameter eksplisit (lihat ADR 0003) supaya test
 * bisa menyodorkan instance yang menunjuk Database Global test.
 */
export async function findSession(
  instance      : AuthInstance,
  requestHeaders: Headers,
): Promise<UserSession | null> {
  return instance.api.getSession({ headers: requestHeaders });
}
