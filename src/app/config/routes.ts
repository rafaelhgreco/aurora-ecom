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
  /**
   * CRUD e área administrativa de produtos — apenas admin.
   * Cobre /admin-produtos, /admin-produtos/novo, etc. (middleware usa startsWith).
   */
  "/admin-produtos": {
    roles: ["admin"],
    redirect: "/dashboard",
  },
};
