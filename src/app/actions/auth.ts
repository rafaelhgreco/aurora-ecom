"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const GENERIC_LOGIN_ERROR =
  "Não foi possível entrar. Verifique email e senha e tente novamente.";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveExpectedCredentials(): {
  email: string;
  password: string;
} | null {
  const fromEnvEmail = process.env.ADMIN_LOGIN_EMAIL?.trim();
  const fromEnvPassword = process.env.ADMIN_LOGIN_PASSWORD;

  if (fromEnvEmail && fromEnvPassword !== undefined && fromEnvPassword !== "") {
    return {
      email: normalizeEmail(fromEnvEmail),
      password: fromEnvPassword,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      email: normalizeEmail(
        process.env.ADMIN_LOGIN_EMAIL_DEV_FALLBACK ?? "admin@aurora.local",
      ),
      password: process.env.ADMIN_LOGIN_PASSWORD_DEV_FALLBACK ?? "admin123",
    };
  }

  return null;
}

export type LoginActionResult = { error: string } | undefined;

export async function loginAction(
  formData: FormData,
): Promise<LoginActionResult> {
  const emailRaw = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!emailRaw?.trim() || !password) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (password.length < 3) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const expected = resolveExpectedCredentials();
  if (!expected) {
    console.error(
      "Login: defina ADMIN_LOGIN_EMAIL e ADMIN_LOGIN_PASSWORD no ambiente.",
    );
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (
    normalizeEmail(emailRaw) !== expected.email ||
    password !== expected.password
  ) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const token = `token_admin_${Date.now()}`;

  try {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect("/admin-produtos");
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }

  redirect("/login");
}
