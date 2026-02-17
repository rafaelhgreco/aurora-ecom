"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  if (password.length < 3) {
    return { error: "A senha deve ter no mínimo 3 caracteres" };
  }

  // Simulação de autenticação (substituir por chamada real ao backend)
  let token = `token_user_${Date.now()}`;

  if (email.includes("admin")) {
    token = `token_admin_${Date.now()}`;
  } else if (email.includes("manager")) {
    token = `token_manager_${Date.now()}`;
  } else if (email.includes("user")) {
    token = `token_user_${Date.now()}`;
  }

  // TODO: Substituir por chamada real ao backend
  // const response = await fetch('https://api.exemplo.com/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password })
  // });
  // const { token, role } = await response.json();

  try {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    // TODO: Validar e sanitizar callbackUrl se vier de query params
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return { error: "Erro ao processar login. Tente novamente." };
  }

  redirect("/dashboard");
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
