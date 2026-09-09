"use server";

import { isAdminPromotionsEnabled } from "@/app/config/feature-flags";
import { requireAdminSession } from "@/app/services/require-admin-session";
import type { SerializedProduct } from "@/core/schemas/product.schema";
import type {
  CreatePromotionInput,
  SerializedPromotion,
  UpdatePromotionInput,
} from "@/core/schemas/promotion.schema";
import { BulkUpdateProductPromotionUseCase } from "@/core/use-cases/bulk-update-product-promotion.use-case";
import { CreatePromotionUseCase } from "@/core/use-cases/create-promotion.use-case";
import { DeletePromotionUseCase } from "@/core/use-cases/delete-promotion.use-case";
import { ListPromotionsUseCase } from "@/core/use-cases/list-promotions.use-case";
import { SetProductPromotionOverridePriceUseCase } from "@/core/use-cases/set-product-promotion-override-price.use-case";
import { UpdatePromotionUseCase } from "@/core/use-cases/update-promotion.use-case";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import { FirestorePromotionRepository } from "@/infrastructure/repositories/firestore-promotion.repository";
import type { ActionResult } from "@/shared/action-result";
import { handleActionError } from "@/shared/errors/action-error";
import { serializeProductForClient } from "@/shared/serialize-product";
import { serializePromotionForClient } from "@/shared/serialize-promotion";

const promotionRepository = new FirestorePromotionRepository();
const productRepository = new FirestoreProductRepository();

const FEATURE_DISABLED_ERROR = "Recurso indisponível.";

/** Só o módulo de promoções em si é privado (a loja consome o preço já decorado, não a lista). */
async function requireAdminAndFlag(): Promise<{ error: string } | null> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { error: auth.error };
  if (!isAdminPromotionsEnabled()) return { error: FEATURE_DISABLED_ERROR };
  return null;
}

export async function listPromotionsAction(): Promise<
  ActionResult<SerializedPromotion[]>
> {
  const guard = await requireAdminAndFlag();
  if (guard) return { success: false, error: guard.error };

  try {
    const useCase = new ListPromotionsUseCase(promotionRepository);
    const promotions = await useCase.execute();

    return {
      success: true,
      data: promotions.map((p) => serializePromotionForClient(p)),
    };
  } catch (error) {
    const { message } = handleActionError(
      "listPromotionsAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

export async function createPromotionAction(
  input: CreatePromotionInput,
): Promise<ActionResult<SerializedPromotion>> {
  const guard = await requireAdminAndFlag();
  if (guard) return { success: false, error: guard.error };

  try {
    const useCase = new CreatePromotionUseCase(promotionRepository);
    const promotion = await useCase.execute(input);

    return { success: true, data: serializePromotionForClient(promotion) };
  } catch (error) {
    const { message, details } = handleActionError(
      "createPromotionAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function updatePromotionAction(
  input: UpdatePromotionInput,
): Promise<ActionResult<SerializedPromotion>> {
  const guard = await requireAdminAndFlag();
  if (guard) return { success: false, error: guard.error };

  try {
    const useCase = new UpdatePromotionUseCase(promotionRepository);
    const promotion = await useCase.execute(input);

    return { success: true, data: serializePromotionForClient(promotion) };
  } catch (error) {
    const { message, details } = handleActionError(
      "updatePromotionAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function deletePromotionAction(
  id: string,
): Promise<ActionResult<void>> {
  const guard = await requireAdminAndFlag();
  if (guard) return { success: false, error: guard.error };

  try {
    const useCase = new DeletePromotionUseCase(
      promotionRepository,
      productRepository,
    );
    await useCase.execute(id);

    return { success: true, data: undefined };
  } catch (error) {
    const { message } = handleActionError(
      "deletePromotionAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

export async function bulkUpdateProductsPromotionAction(input: {
  productIds: string[];
  promotionId: string | null;
}): Promise<ActionResult<{ updatedCount: number; failedIds: string[] }>> {
  const guard = await requireAdminAndFlag();
  if (guard) return { success: false, error: guard.error };

  try {
    const useCase = new BulkUpdateProductPromotionUseCase(
      productRepository,
      promotionRepository,
    );
    const result = await useCase.execute(input);

    return { success: true, data: result };
  } catch (error) {
    const { message, details } = handleActionError(
      "bulkUpdateProductsPromotionAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function setProductPromotionOverridePriceAction(input: {
  productId: string;
  overridePrice: number | null;
}): Promise<ActionResult<SerializedProduct>> {
  const guard = await requireAdminAndFlag();
  if (guard) return { success: false, error: guard.error };

  try {
    const useCase = new SetProductPromotionOverridePriceUseCase(
      productRepository,
    );
    const product = await useCase.execute(input);

    return { success: true, data: serializeProductForClient(product) };
  } catch (error) {
    const { message, details } = handleActionError(
      "setProductPromotionOverridePriceAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}
