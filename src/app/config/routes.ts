import type { UserRole } from "@/types/auth";

export const publicRoutes = [
  "/",
  "/login",
  "/logout",
  "/not-found",
  "/sobre",
  "/produto",
  "/arquivo",
  "/loja",
] as const;

export const authRoutes = ["/login", "/cadastro", "/recuperar-senha"] as const;

/** Após login com sessão válida em rota de auth */
export const DEFAULT_LOGIN_REDIRECT = "/admin";

export const ACCESS_DENIED_REDIRECT = "/not-found";

type RouteConfig = {
  roles: UserRole[];
  redirect?: string;
};

export const privateRoutes: Record<string, RouteConfig> = {
  "/admin": {
    roles: ["admin"],
    redirect: "/not-found",
  },
};
