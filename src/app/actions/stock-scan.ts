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

export async function checkBarcodeAction(
  barcode: string,
): Promise<ActionResult<{ exists: boolean; product: Product | null }>> {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) return { success: false, error: auth.error };

    if (!isAdminStockScanEnabled()) {
      return { success: false, error: "Recurso de bipagem não disponível" };
    }

    const product = await productRepository.findByBarcode(barcode.trim());

    return {
      success: true,
      data: {
        exists: !!product,
        product: product ? serializeProductForClient(product) : null,
      },
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "checkBarcodeAction",
      error,
      "admin",
    );
    return { success: false, error: message, details };
  }
}

export async function scanBarcodeAction(
  barcode: string,
  quantity?: number,
): Promise<ActionResult<{ product: Product; created: boolean }>> {
  try {
    const auth = await requireAdminSession();

    if ("error" in auth) {
      return { success: false, error: auth.error };
    }

    if (!isAdminStockScanEnabled()) {
      return {
        success: false,
        error: "Recurso de bipagem não disponível",
      };
    }

    const useCase = new ScanBarcodeUseCase(productRepository);
    const result = await useCase.execute({
      barcode,
      quantity,
    } as ScanBarcodeInput);

    return {
      success: true,
      data: {
        product: serializeProductForClient(result.product),
        created: result.created,
      },
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "scanBarcodeAction",
      error,
      "admin",
    );
    return {
      success: false,
      error: message,
      details,
    };
  }
}
