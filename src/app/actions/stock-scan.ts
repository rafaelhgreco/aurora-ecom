"use server";

import { isAdminStockScanEnabled } from "@/app/config/feature-flags";
import { requireAdminSession } from "@/app/services/require-admin-session";
import type { Product, ScanBarcodeInput } from "@/core/schemas/product.schema";
import { ScanBarcodeUseCase } from "@/core/use-cases/scan-barcode.use-case";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import type { ActionResult } from "@/shared/action-result";
import { handleActionError } from "@/shared/errors/action-error";
import { serializeProductForClient } from "@/shared/serialize-product";

const productRepository = new FirestoreProductRepository();

export async function scanBarcodeAction(
  barcode: string,
): Promise<ActionResult<{ product: Product; created: boolean }>> {
  console.log("[scanBarcodeAction] chamada recebida com barcode:", barcode);
  try {
    const auth = await requireAdminSession();
    console.log("[scanBarcodeAction] auth result:", auth);

    if ("error" in auth) {
      console.warn("[scanBarcodeAction] sessão inválida:", auth.error);
      return { success: false, error: auth.error };
    }

    const flagEnabled = isAdminStockScanEnabled();
    console.log("[scanBarcodeAction] isAdminStockScanEnabled:", flagEnabled);

    if (!flagEnabled) {
      console.warn(
        "[scanBarcodeAction] feature flag FEATURE_ADMIN_STOCK_SCAN desabilitada — verifique o .env",
      );
      return {
        success: false,
        error: "Recurso de bipagem não disponível",
      };
    }

    const useCase = new ScanBarcodeUseCase(productRepository);
    console.log("[scanBarcodeAction] executando use case...");
    const result = await useCase.execute({ barcode } as ScanBarcodeInput);
    console.log("[scanBarcodeAction] use case retornou:", result);

    return {
      success: true,
      data: {
        product: serializeProductForClient(result.product),
        created: result.created,
      },
    };
  } catch (error) {
    console.error("[scanBarcodeAction] erro capturado:", error);
    const { message, details } = handleActionError(
      "scanBarcodeAction",
      error,
      "admin",
    );
    console.error("[scanBarcodeAction] mensagem tratada:", message, details);
    return {
      success: false,
      error: message,
      details,
    };
  }
}
