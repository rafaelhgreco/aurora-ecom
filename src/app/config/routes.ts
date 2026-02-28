import type { UserRole } from "@/types/auth";

export const publicRoutes = [
  "/",
  "/login",
  "/logout",
  "/not-found",
  "/sobre",
  "/produto",
] as const;

export const authRoutes = ["/login", "/cadastro", "/recuperar-senha"] as const;

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export const ACCESS_DENIED_REDIRECT = "/not-found";

type RouteConfig = {
  roles: UserRole[];
  redirect?: string;
};

export const privateRoutes: Record<string, RouteConfig> = {
  "/dashboard": {
    roles: ["admin", "manager", "user"],
  },
  "/produtos/novo": {
    roles: ["admin"],
    redirect: "/admin-produtos",
  },
};
