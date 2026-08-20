import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { findSession, type UserSession } from "@/lib/server/auth/service";

/**
 * Sesi milik permintaan yang sedang diproses. Dibungkus `cache()` supaya beberapa Server
 * Component dalam satu render hanya sekali menanyakannya ke Database Global.
 */
export const getCurrentSession = cache(async (): Promise<UserSession | null> => {
  return findSession(auth, await headers());
});

/** Dipakai halaman yang wajib login: melempar Pengguna ke /login kalau sesinya tidak ada. */
export async function requireSession(): Promise<UserSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/** Dipakai halaman login/daftar: Pengguna yang sudah login tidak perlu melihatnya lagi. */
export async function redirectWhenSignedIn(): Promise<void> {
  if (await getCurrentSession()) {
    redirect("/");
  }
}
