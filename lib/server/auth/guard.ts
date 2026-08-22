import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findSession, type AuthInstance, type UserSession } from "@/lib/server/auth/service";
import { listMembershipsForUser } from "@/lib/server/user/service";
import type { GlobalClient } from "@/lib/server/user/types";

export const getCurrentSession = cache(async (): Promise<UserSession | null> => {
  return findSession(auth, await headers());
});

export class EmailBelumTerverifikasiError extends Error {}

export function ensureEmailTerverifikasi(session: UserSession): void {
  if (!session.user.emailVerified) {
    throw new EmailBelumTerverifikasiError("Email Anda belum terverifikasi");
  }
}

export async function requireSession(): Promise<UserSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function redirectWhenSignedIn(): Promise<void> {
  if (await getCurrentSession()) {
    redirect("/");
  }
}

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

export async function requireBelumPunyaPerusahaan(): Promise<UserSession> {
  return resolveDaftarPerusahaanAccess(auth, prisma, await headers());
}

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

export async function requireSudahPunyaPerusahaan(): Promise<UserSession> {
  return resolveSudahPunyaPerusahaanAccess(auth, prisma, await headers());
}

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

export async function requirePerusahaanAktif(): Promise<UserSession> {
  return resolvePerusahaanAktifAccess(auth, prisma, await headers());
}
