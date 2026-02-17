export type UserRole = "admin" | "manager" | "user";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
