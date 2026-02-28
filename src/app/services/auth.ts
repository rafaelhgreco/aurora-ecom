import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { UserRole } from "@/types/auth";

export function getUserRole(token: RequestCookie | undefined): UserRole | null {
  if (!token?.value) return null;

  try {
    if (token.value.includes("admin")) return "admin";
    if (token.value.includes("manager")) return "manager";
    if (token.value.includes("user")) return "user";

    return "user";
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    return null;
  }
}

export function isValidToken(token: RequestCookie | undefined): boolean {
  if (!token?.value) return false;

  try {
    return token.value.length > 0;
  } catch {
    return false;
  }
}
