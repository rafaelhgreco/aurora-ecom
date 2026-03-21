"use server";

import {
  isAdminSoftDeactivateEnabled,
  isAdminStockToolsEnabled,
} from "@/app/config/feature-flags";
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
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import {
  canPauseProductOnVitrine,
  pauseProductOnVitrineBlockedReason,
} from "@/shared/product-vitrine-rules";

const productRepository = new FirestoreProductRepository();

async function validatePauseVitrineFromUpdate(
  input: UpdateProductInput,
): Promise<string | null> {
  if (input.isActive !== false) return null;
  const getUseCase = new GetProductByIdUseCase(productRepository);
  const current = await getUseCase.execute(input.id);
  const nextStock = input.stock !== undefined ? input.stock : current.stock;
  const nextStockBySize =
    input.stockBySize !== undefined ? input.stockBySize : current.stockBySize;
  const nextSizes = input.sizes !== undefined ? input.sizes : current.sizes;
  if (
    !canPauseProductOnVitrine({
      stock: nextStock,
      stockBySize: nextStockBySize,
      sizes: nextSizes,
    })
  ) {
    return (
      pauseProductOnVitrineBlockedReason({
        stock: nextStock,
        stockBySize: nextStockBySize,
        sizes: nextSizes,
      }) || "Não é possível pausar este produto na vitrine."
    );
  }
  return null;
}

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
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao listar produtos",
    };
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
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao buscar produto",
    };
  }
}

export async function createProductAction(
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
  try {
    const useCase = new CreateProductUseCase(productRepository);
    const product = await useCase.execute(input);

    return {
      success: true,
      data: serializeProductForClient(product as Product),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        details: error.errors,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao criar produto",
    };
  }
}

export async function updateProductAction(
  input: UpdateProductInput,
): Promise<ActionResult<Product>> {
  try {
    const pauseError = await validatePauseVitrineFromUpdate(input);
    if (pauseError) {
      return { success: false, error: pauseError };
    }

    const useCase = new UpdateProductUseCase(productRepository);
    const product = await useCase.execute(input);

    return {
      success: true,
      data: serializeProductForClient(product as Product),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        details: error.errors,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao atualizar produto",
    };
  }
}

export async function deleteProductAction(
  id: string,
): Promise<ActionResult<void>> {
  try {
    const useCase = new DeleteProductUseCase(productRepository);
    await useCase.execute(id);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao deletar produto",
    };
  }
}

/**
 * Baixa ou ajusta estoque por delta inteiro (ex.: -1). Exige feature flag no servidor.
 */
export async function adjustProductStockAction(
  id: string,
  delta: number,
): Promise<ActionResult<Product>> {
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
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao ajustar estoque",
    };
  }
}

/**
 * Ativa/desativa produto na vitrine (inativo continua listado como esgotado/indisponível).
 */
export async function setProductActiveFlagAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<Product>> {
  if (!isAdminSoftDeactivateEnabled()) {
    return { success: false, error: "Recurso indisponível." };
  }

  const trimmedId = id?.trim();
  if (!trimmedId) {
    return { success: false, error: "ID inválido." };
  }

  try {
    if (isActive === false) {
      const getUseCase = new GetProductByIdUseCase(productRepository);
      const current = await getUseCase.execute(trimmedId);
      if (
        !canPauseProductOnVitrine({
          stock: current.stock,
          stockBySize: current.stockBySize,
          sizes: current.sizes,
        })
      ) {
        return {
          success: false,
          error:
            pauseProductOnVitrineBlockedReason({
              stock: current.stock,
              stockBySize: current.stockBySize,
              sizes: current.sizes,
            }) || "Não é possível pausar este produto na vitrine.",
        };
      }
    }

    const updateUseCase = new UpdateProductUseCase(productRepository);
    const product = await updateUseCase.execute({
      id: trimmedId,
      isActive,
    });
    return {
      success: true,
      data: serializeProductForClient(product as Product),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        details: error.errors,
      };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar disponibilidade",
    };
  }
}
