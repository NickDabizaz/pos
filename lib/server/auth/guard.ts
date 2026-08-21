import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findSession, type AuthInstance, type UserSession } from "@/lib/server/auth/service";
import { listMembershipsForUser } from "@/lib/server/user/service";
import type { GlobalClient } from "@/lib/server/user/types";

/** Sesi milik permintaan saat ini, di-cache per render supaya tidak ditanya berulang. */
export const getCurrentSession = cache(async (): Promise<UserSession | null> => {
  return findSession(auth, await headers());
});

/** Melempar ke /login kalau belum ada sesi. */
export async function requireSession(): Promise<UserSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/** Melempar ke / kalau sudah login — dipakai halaman login/daftar. */
export async function redirectWhenSignedIn(): Promise<void> {
  if (await getCurrentSession()) {
    redirect("/");
  }
}

/**
 * Melempar ke /login kalau belum ada sesi, dan ke / kalau sudah punya Keanggotaan —
 * Pengguna tidak boleh mendaftarkan Perusahaan kedua. Instance Better Auth dan Database
 * Global dilewatkan eksplisit (ADR 0003) supaya test bisa memakai instance test.
 */
export async function resolveDaftarPerusahaanAccess(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<UserSession> {
  const session = await findSession(instance, requestHeaders);
  if (!session) {
    redirect("/login");
  }

  const memberships = await listMembershipsForUser(globalDb, session.user.id);
  if (memberships.length > 0) {
    redirect("/");
  }

  return session;
}

/** Pembungkus produksi {@link resolveDaftarPerusahaanAccess}. */
export async function requireBelumPunyaPerusahaan(): Promise<UserSession> {
  return resolveDaftarPerusahaanAccess(auth, prisma, await headers());
}

/**
 * Melempar ke /login kalau belum ada sesi, dan ke /daftar-perusahaan kalau belum punya
 * Keanggotaan sama sekali. Instance Better Auth dan Database Global dilewatkan eksplisit
 * (ADR 0003) supaya test bisa memakai instance test.
 */
export async function resolveSudahPunyaPerusahaanAccess(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<UserSession> {
  const session = await findSession(instance, requestHeaders);
  if (!session) {
    redirect("/login");
  }

  const memberships = await listMembershipsForUser(globalDb, session.user.id);
  if (memberships.length === 0) {
    redirect("/daftar-perusahaan");
  }

  return session;
}

/** Pembungkus produksi {@link resolveSudahPunyaPerusahaanAccess}. */
export async function requireSudahPunyaPerusahaan(): Promise<UserSession> {
  return resolveSudahPunyaPerusahaanAccess(auth, prisma, await headers());
}
