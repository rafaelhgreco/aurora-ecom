import { cookies } from "next/headers";
import { getSession } from "@/app/services/auth";
import { UNAUTHORIZED } from "@/shared/errors/client-error-messages";

export async function requireAdminSession(): Promise<
  { email: string } | { error: string }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  const session = await getSession(token);
  if (!session || session.role !== "admin") {
    return { error: UNAUTHORIZED };
  }
  return { email: session.sub };
}
