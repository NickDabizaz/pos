import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findSession, type AuthInstance, type UserSession } from "@/lib/server/auth/service";
import { findKodemenuHakMenuAktif } from "@/lib/server/menu/repository";
import { bolehAksesMenu } from "@/lib/server/menu/service";
import { resolvePerusahaanAktif } from "@/lib/server/perusahaan/service";
import { findPerusahaanByUser } from "@/lib/server/user/repository";
import type { GlobalClient, PerusahaanMembership } from "@/lib/server/user/types";

export const getCurrentSession = cache(async (): Promise<UserSession | null> => {
  const session = await findSession(auth, await headers());

  return session;
});

export function cekEmailTerverifikasi(session: UserSession): void {
  if (!session.user.emailVerified) {
    throw new Error("Email Anda belum terverifikasi", { cause: "EMAIL_BELUM_TERVERIFIKASI" });
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

async function resolvePerusahaanAktifOrRedirect(
  globalDb   : GlobalClient,
  session    : UserSession,
  memberships: PerusahaanMembership[],
): Promise<PerusahaanMembership> {
  const aktif = await resolvePerusahaanAktif(globalDb, {
    iduser           : session.user.id,
    idsesi           : session.session.id,
    idperusahaanAktif: session.session.idperusahaan ?? null,
    memberships,
  });

  if (!aktif) {
    redirect("/pilih-perusahaan");
  }

  return aktif;
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

  const memberships = await findPerusahaanByUser(globalDb, session.user.id);
  if (memberships.length > 0) {
    const aktif = await resolvePerusahaanAktifOrRedirect(globalDb, session, memberships);
    redirect(aktif.status === 1 ? "/" : "/subscription");
  }

  return session;
}

export async function requireBelumPunyaPerusahaan(): Promise<UserSession> {
  const session = await resolveDaftarPerusahaanAccess(auth, prisma, await headers());

  return session;
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

  const memberships = await findPerusahaanByUser(globalDb, session.user.id);
  if (memberships.length === 0) {
    redirect("/daftar-perusahaan");
  }

  return session;
}

export async function requireSudahPunyaPerusahaan(): Promise<UserSession> {
  const session = await resolveSudahPunyaPerusahaanAccess(auth, prisma, await headers());

  return session;
}

export async function resolvePerusahaanAktifAccess(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
): Promise<UserSession> {
  const session = await resolveSudahPunyaPerusahaanAccess(instance, globalDb, requestHeaders);

  const memberships = await findPerusahaanByUser(globalDb, session.user.id);
  const aktif = await resolvePerusahaanAktifOrRedirect(globalDb, session, memberships);
  if (aktif.status !== 1) {
    redirect("/subscription");
  }

  return session;
}

export async function requirePerusahaanAktif(): Promise<UserSession> {
  const session = await resolvePerusahaanAktifAccess(auth, prisma, await headers());

  return session;
}

export interface AksesMenuResult {
  session          : UserSession;
  isOwner          : boolean;
  kodemenuDiizinkan: ReadonlySet<string>;
}

export async function requireAksesMenu(
  instance      : AuthInstance,
  globalDb      : GlobalClient,
  requestHeaders: Headers,
  kodemenu      : string,
): Promise<AksesMenuResult> {
  const session = await findSession(instance, requestHeaders);
  if (!session) {
    throw new Error("Anda harus login terlebih dahulu", { cause: "TIDAK_LOGIN" });
  }

  const memberships = await findPerusahaanByUser(globalDb, session.user.id);
  const aktif = await resolvePerusahaanAktif(globalDb, {
    iduser           : session.user.id,
    idsesi           : session.session.id,
    idperusahaanAktif: session.session.idperusahaan ?? null,
    memberships,
  });
  if (!aktif) {
    throw new Error("Perusahaan Aktif tidak ditemukan", { cause: "PERUSAHAAN_TIDAK_AKTIF" });
  }
  if (aktif.status !== 1) {
    throw new Error("Langganan Perusahaan tidak aktif", { cause: "LANGGANAN_TIDAK_AKTIF" });
  }

  const kodemenuDiizinkan = aktif.isowner
    ? new Set<string>()
    : new Set(await findKodemenuHakMenuAktif(globalDb, session.user.id, aktif.idperusahaan));

  if (!bolehAksesMenu({ isOwner: aktif.isowner, kodemenuDiizinkan, kodemenu })) {
    throw new Error("Anda tidak punya Hak Menu untuk fitur ini", { cause: "TIDAK_PUNYA_HAK_MENU" });
  }

  const hasil: AksesMenuResult = { session, isOwner: aktif.isowner, kodemenuDiizinkan };

  return hasil;
}
