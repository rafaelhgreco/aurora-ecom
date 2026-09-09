"use server";

import {
  isAdminPromotionsEnabled,
  isAdminSoftDeactivateEnabled,
  isAdminStockToolsEnabled,
} from "@/app/config/feature-flags";
import { requireAdminSession } from "@/app/services/require-admin-session";
import type {
  CreateProductInput,
  ProductFilter,
  PublishProductInput,
  SerializedProduct,
  UpdateProductInput,
} from "@/core/schemas/product.schema";
import { BulkUpdateProductCategoryUseCase } from "@/core/use-cases/bulk-update-product-category.use-case";
import { CreateProductUseCase } from "@/core/use-cases/create-product.use-case";
import { DeleteProductUseCase } from "@/core/use-cases/delete-product.use-case";
import { GetProductByIdUseCase } from "@/core/use-cases/get-product-by-id.use-case";
import { ListProductsUseCase } from "@/core/use-cases/list-products.use-case";
import { PublishProductUseCase } from "@/core/use-cases/publish-product.use-case";
import { UpdateProductUseCase } from "@/core/use-cases/update-product.use-case";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import { FirestorePromotionRepository } from "@/infrastructure/repositories/firestore-promotion.repository";
import type { ActionResult } from "@/shared/action-result";
import { handleActionError } from "@/shared/errors/action-error";
import { decorateProductsWithPricing } from "@/shared/product-pricing";
import { serializeProductForClient } from "@/shared/serialize-product";

const productRepository = new FirestoreProductRepository();
const promotionRepository = new FirestorePromotionRepository();

export async function listProductsAction(
  filter?: ProductFilter,
): Promise<ActionResult<{ data: SerializedProduct[]; totalCount: number }>> {
  try {
    const useCase = new ListProductsUseCase(productRepository);
    const { data: products, totalCount } = await useCase.execute(filter);

    const serializedProducts = products.map((p) =>
      serializeProductForClient(p),
    );
    const pricedProducts = await decorateProductsWithPricing(
      serializedProducts,
      promotionRepository,
      isAdminPromotionsEnabled(),
    );

    return {
      success: true,
      data: { data: pricedProducts, totalCount },
    };
  } catch (error) {
    const { message } = handleActionError(
      "listProductsAction",
      error,
      "public",
    );
    return { success: false, error: message };
  }
}

export async function getProductByIdAction(
  id: string,
): Promise<ActionResult<SerializedProduct>> {
  try {
    const useCase = new GetProductByIdUseCase(productRepository);
    const product = await useCase.execute(id);

    const [pricedProduct] = await decorateProductsWithPricing(
      [serializeProductForClient(product)],
      promotionRepository,
      isAdminPromotionsEnabled(),
    );

    return {
      success: true,
      data: pricedProduct,
    };
  } catch (error) {
    const { message } = handleActionError(
      "getProductByIdAction",
      error,
      "public",
    );
    return { success: false, error: message };
  }
}

export async function createProductAction(
  input: CreateProductInput,
): Promise<ActionResult<SerializedProduct>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new CreateProductUseCase(productRepository);
    const product = await useCase.execute(input);

    return {
      success: true,
      data: serializeProductForClient(product),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "createProductAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function updateProductAction(
  input: UpdateProductInput,
): Promise<ActionResult<SerializedProduct>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const payload: UpdateProductInput = { ...input };
    if (input.isActive === false && input.id) {
      payload.stock = 0;
      payload.stockBySize = {};
      const getUseCase = new GetProductByIdUseCase(productRepository);
      const current = await getUseCase.execute(input.id);
      if (current.colorVariants?.length) {
        payload.colorVariants = current.colorVariants.map((v) => ({
          ...v,
          stockBySize: {},
        }));
      }
    }

    const useCase = new UpdateProductUseCase(productRepository);
    const product = await useCase.execute(payload);

    return {
      success: true,
      data: serializeProductForClient(product),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "updateProductAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function bulkUpdateProductsCategoryAction(input: {
  productIds: string[];
  category: string;
}): Promise<ActionResult<{ updatedCount: number; failedIds: string[] }>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new BulkUpdateProductCategoryUseCase(productRepository);
    const result = await useCase.execute(input);

    return { success: true, data: result };
  } catch (error) {
    const { message, details } = handleActionError(
      "bulkUpdateProductsCategoryAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function deleteProductAction(
  id: string,
): Promise<ActionResult<void>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new DeleteProductUseCase(productRepository);
    await useCase.execute(id);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    const { message } = handleActionError(
      "deleteProductAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

/**
 * Baixa ou ajusta estoque por delta inteiro (ex.: -1). Exige feature flag no servidor.
 */
export async function adjustProductStockAction(
  id: string,
  delta: number,
): Promise<ActionResult<SerializedProduct>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  if (!isAdminStockToolsEnabled()) {
    return { success: false, error: "Recurso indisponível." };
  }

  const trimmedId = id?.trim();
  if (!trimmedId || !Number.isFinite(delta)) {
    return { success: false, error: "Dados inválidos." };
  }
  const intDelta = Math.trunc(delta);
  if (intDelta === 0) {
    return { success: false, error: "Informe uma alteração de estoque." };
  }

  try {
    const getUseCase = new GetProductByIdUseCase(productRepository);
    const current = await getUseCase.execute(trimmedId);
    const newStock = Math.max(0, current.stock + intDelta);
    const updateUseCase = new UpdateProductUseCase(productRepository);
    const product = await updateUseCase.execute({
      id: trimmedId,
      stock: newStock,
    });
    return {
      success: true,
      data: serializeProductForClient(product),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "adjustProductStockAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

/**
 * Ativa/desativa produto na vitrine (inativo continua listado como esgotado/indisponível).
 */
export async function setProductActiveFlagAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<SerializedProduct>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  if (!isAdminSoftDeactivateEnabled()) {
    return { success: false, error: "Recurso indisponível." };
  }

  const trimmedId = id?.trim();
  if (!trimmedId) {
    return { success: false, error: "ID inválido." };
  }

  try {
    const updateUseCase = new UpdateProductUseCase(productRepository);

    if (isActive === false) {
      const getUseCase = new GetProductByIdUseCase(productRepository);
      const current = await getUseCase.execute(trimmedId);
      const colorVariants = current.colorVariants?.length
        ? current.colorVariants.map((v) => ({ ...v, stockBySize: {} }))
        : undefined;
      const product = await updateUseCase.execute({
        id: trimmedId,
        isActive: false,
        stock: 0,
        stockBySize: {},
        ...(colorVariants ? { colorVariants } : {}),
      });
      return {
        success: true,
        data: serializeProductForClient(product),
      };
    }

    const product = await updateUseCase.execute({
      id: trimmedId,
      isActive: true,
    });
    return {
      success: true,
      data: serializeProductForClient(product),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "setProductActiveFlagAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function publishProductAction(
  input: PublishProductInput,
): Promise<ActionResult<SerializedProduct>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new PublishProductUseCase(productRepository);
    const product = await useCase.execute(input);

    return {
      success: true,
      data: serializeProductForClient(product),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "publishProductAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}
