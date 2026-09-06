"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/app/services/require-admin-session";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import type { ActionResult } from "./products";

export async function scanBarcodeAction(
  barcode: string,
): Promise<ActionResult<void>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  const trimmed = barcode?.trim();
  if (!trimmed) {
    return { success: false, error: "Código de barras inválido." };
  }

  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: "Erro ao conectar com banco de dados." };
    }

    const docRef = db.collection("products").doc(trimmed);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      // Increment stock
      await docRef.update({
        stock: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new DRAFT
      await docRef.set({
        barcode: trimmed,
        status: "DRAFT",
        stock: 1,
        title: `Produto Pendente ${trimmed}`, // fallback title
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true, // It can be active but draft
      });
    }

    revalidatePath("/admin-produtos/pendentes");
    return { success: true, data: undefined };
  } catch (error: any) {
    console.error("[scanBarcodeAction] Erro:", error);
    return { success: false, error: "Erro ao comunicar com o banco de dados" };
  }
}
