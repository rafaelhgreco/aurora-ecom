"use server";

import type {
  CreateProductInput,
  Product,
  ProductFilter,
  UpdateProductInput,
} from "@/core/schemas/product.schema";
import { CreateProductUseCase } from "@/core/use-cases/create-product.use-case";
import { GetProductByIdUseCase } from "@/core/use-cases/get-product-by-id.use-case";
import { ListProductsUseCase } from "@/core/use-cases/list-products.use-case";
import { UpdateProductUseCase } from "@/core/use-cases/update-product.use-case";
import { productRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

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

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
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
      data: product,
    };
  } catch (error) {
    console.error("Erro ao buscar produto:", error);

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
      data: product,
    };
  } catch (error) {
    console.error("Erro ao criar produto:", error);

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
    const useCase = new UpdateProductUseCase(productRepository);
    const product = await useCase.execute(input);

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);

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
