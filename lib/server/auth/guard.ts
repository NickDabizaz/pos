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

export class EmailBelumTerverifikasiError extends Error {}

/**
 * Melempar {@link EmailBelumTerverifikasiError} kalau Pengguna dalam sesi ini belum
 * memverifikasi emailnya. Dipakai aksi yang mensyaratkan email terverifikasi (tiket 05) —
 * `session` selalu diambil ulang lewat `findSession`/`getCurrentSession` per permintaan,
 * jadi Pengguna yang baru saja verifikasi di tengah sesi langsung lolos tanpa login ulang.
 */
export function ensureEmailTerverifikasi(session: UserSession): void {
  if (!session.user.emailVerified) {
    throw new EmailBelumTerverifikasiError("Email Anda belum terverifikasi");
  }
}

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
    redirect(memberships[0].status === 1 ? "/" : "/subscription");
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

/**
 * Melempar ke /login kalau belum ada sesi, ke /daftar-perusahaan kalau belum punya
 * Keanggotaan, dan ke /subscription kalau Perusahaannya belum aktif (`status !== 1`) —
 * dipakai halaman yang mensyaratkan Perusahaan aktif sepenuhnya (mis. Dashboard).
 */
export async function resolvePerusahaanAktifAccess(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<UserSession> {
  const session = await resolveSudahPunyaPerusahaanAccess(instance, globalDb, requestHeaders);

  const memberships = await listMembershipsForUser(globalDb, session.user.id);
  if (memberships[0].status !== 1) {
    redirect("/subscription");
  }

  return session;
}

/** Pembungkus produksi {@link resolvePerusahaanAktifAccess}. */
export async function requirePerusahaanAktif(): Promise<UserSession> {
  return resolvePerusahaanAktifAccess(auth, prisma, await headers());
}
