"use server";

import {
  isAdminSoftDeactivateEnabled,
  isAdminStockToolsEnabled,
} from "@/app/config/feature-flags";
import { requireAdminSession } from "@/app/services/require-admin-session";
import type {
  CreateProductInput,
  Product,
  ProductFilter,
  UpdateProductInput,
} from "@/core/schemas/product.schema";
import { CreateProductUseCase } from "@/core/use-cases/create-product.use-case";
import { DeleteProductUseCase } from "@/core/use-cases/delete-product.use-case";
import { GetProductByIdUseCase } from "@/core/use-cases/get-product-by-id.use-case";
import { ListProductsUseCase } from "@/core/use-cases/list-products.use-case";
import { UpdateProductUseCase } from "@/core/use-cases/update-product.use-case";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import { handleActionError } from "@/shared/errors/action-error";

const productRepository = new FirestoreProductRepository();

function serializeProductForClient(p: Product): Product {
  return {
    ...p,
    createdAt: p.createdAt
      ? new Date(p.createdAt as Date | string).toISOString()
      : undefined,
    updatedAt: p.updatedAt
      ? new Date(p.updatedAt as Date | string).toISOString()
      : undefined,
  } as Product;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      details?: Array<{ field: string; message: string }>;
    };

export async function listProductsAction(
  filter?: ProductFilter,
): Promise<ActionResult<Product[]>> {
  try {
    const useCase = new ListProductsUseCase(productRepository);
    const products = await useCase.execute(filter);

    const serializedProducts = products.map((p) =>
      serializeProductForClient(p as Product),
    );

    return {
      success: true,
      data: serializedProducts,
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
): Promise<ActionResult<Product>> {
  try {
    const useCase = new GetProductByIdUseCase(productRepository);
    const product = await useCase.execute(id);

    return {
      success: true,
      data: serializeProductForClient(product as Product),
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
): Promise<ActionResult<Product>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new CreateProductUseCase(productRepository);
    const product = await useCase.execute(input);

    return {
      success: true,
      data: serializeProductForClient(product as Product),
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
): Promise<ActionResult<Product>> {
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
      data: serializeProductForClient(product as Product),
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
): Promise<ActionResult<Product>> {
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
      data: serializeProductForClient(product as Product),
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
): Promise<ActionResult<Product>> {
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
        data: serializeProductForClient(product as Product),
      };
    }

    const product = await updateUseCase.execute({
      id: trimmedId,
      isActive: true,
    });
    return {
      success: true,
      data: serializeProductForClient(product as Product),
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
