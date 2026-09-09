"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signAdminToken } from "@/app/lib/jwt";
import { getAdminFromFirestore } from "@/infrastructure/repositories/firestore-admin.repository";
import { LOGIN_GENERIC } from "@/shared/errors/client-error-messages";
import { logServerError } from "@/shared/errors/log-server-error";

const GENERIC_LOGIN_ERROR = LOGIN_GENERIC;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Fallback quando admin não está no Firestore (desenvolvimento) */
function resolveEnvFallback(): { email: string; password: string } | null {
  const email = process.env.ADMIN_LOGIN_EMAIL?.trim();
  const password = process.env.ADMIN_LOGIN_PASSWORD;

  if (email && password) {
    return { email: normalizeEmail(email), password };
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
  const emailEntry = formData.get("email");
  const passwordEntry = formData.get("password");

  if (typeof emailEntry !== "string" || typeof passwordEntry !== "string") {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const emailRaw = emailEntry;
  const password = passwordEntry;

  if (!emailRaw.trim() || !password) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (password.length < 3) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const normalizedEmail = normalizeEmail(emailRaw);

  let isValid = false;

  const adminFromFirestore = await getAdminFromFirestore();
  if (adminFromFirestore?.email && adminFromFirestore?.passwordHash) {
    if (adminFromFirestore.email !== normalizedEmail) {
      return { error: GENERIC_LOGIN_ERROR };
    }
    isValid = await bcrypt.compare(password, adminFromFirestore.passwordHash);
  } else {
    const envFallback = resolveEnvFallback();
    if (
      envFallback &&
      envFallback.email === normalizedEmail &&
      envFallback.password === password
    ) {
      isValid = true;
    }
  }

  if (!isValid) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const token = await signAdminToken(normalizedEmail);

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
    logServerError("loginAction", error);
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect("/admin");
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  } catch (error) {
    logServerError("logoutAction", error);
  }

  redirect("/login");
}
