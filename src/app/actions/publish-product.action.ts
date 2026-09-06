"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/app/services/require-admin-session";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import type { ActionResult } from "./products";

interface PublishProductInput {
  barcode: string;
  title: string;
  price: number;
}

export async function publishProductAction(
  input: PublishProductInput,
): Promise<ActionResult<void>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  const trimmedBarcode = input.barcode?.trim();
  if (!trimmedBarcode) {
    return { success: false, error: "Código de barras inválido." };
  }

  if (input.price < 0) {
    return { success: false, error: "Preço inválido" };
  }

  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: "Erro ao conectar com banco de dados." };
    }

    const docRef = db.collection("products").doc(trimmedBarcode);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: "Produto pendente não encontrado." };
    }

    await docRef.update({
      title: input.title,
      price: input.price,
      status: "ACTIVE",
    });

    revalidatePath("/admin-produtos/pendentes");
    return { success: true, data: undefined };
  } catch (error: any) {
    console.error("[publishProductAction] Erro:", error);
    return { success: false, error: "Erro ao comunicar com o banco de dados" };
  }
}
