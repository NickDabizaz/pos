import type { auth } from "@/lib/auth";

export type AuthInstance = typeof auth;

export type UserSession = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;

export async function findSession(
  instance      : AuthInstance,
  requestHeaders: Headers,
): Promise<UserSession | null> {
  return instance.api.getSession({ headers: requestHeaders });
}
