import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { UserRole } from "@/types/auth";

export function getUserRole(token: RequestCookie | undefined): UserRole | null {
  if (!token?.value) return null;

  try {
    // TODO: Implementar lógica real de decodificação do token JWT
    // Exemplo: const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    // return decoded.role;

    // Simulação temporária para desenvolvimento
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
    // TODO: Implementar validação real do JWT
    // Exemplo: jwt.verify(token.value, process.env.JWT_SECRET);
    return token.value.length > 0;
  } catch {
    return false;
  }
}
