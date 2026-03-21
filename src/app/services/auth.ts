import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { verifyAdminToken } from "@/app/lib/jwt";
import type { UserRole } from "@/types/auth";

export async function getSession(
  token: RequestCookie | undefined,
): Promise<{ role: UserRole; sub: string } | null> {
  if (!token?.value) return null;
  const payload = await verifyAdminToken(token.value);
  return payload ? { role: payload.role, sub: payload.sub } : null;
}

export async function getUserRole(
  token: RequestCookie | undefined,
): Promise<UserRole | null> {
  const session = await getSession(token);
  return session?.role ?? null;
}

export async function isValidToken(
  token: RequestCookie | undefined,
): Promise<boolean> {
  return (await getSession(token)) !== null;
}
