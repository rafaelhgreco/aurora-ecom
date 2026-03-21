import type { UserRole } from "@/types/auth";

export const publicRoutes = [
  "/",
  "/login",
  "/logout",
  "/not-found",
  "/sobre",
  "/produto",
  "/arquivo",
] as const;

export const authRoutes = ["/login", "/cadastro", "/recuperar-senha"] as const;

/** Após login com sessão válida em rota de auth */
export const DEFAULT_LOGIN_REDIRECT = "/admin-produtos";

export const ACCESS_DENIED_REDIRECT = "/not-found";

type RouteConfig = {
  roles: UserRole[];
  redirect?: string;
};

export const privateRoutes: Record<string, RouteConfig> = {
  "/admin-produtos": {
    roles: ["admin"],
    redirect: "/not-found",
  },
  "/admin-pedidos": {
    roles: ["admin"],
    redirect: "/not-found",
  },
};
