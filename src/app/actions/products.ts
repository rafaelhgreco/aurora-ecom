"use server";

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

const productRepository = new FirestoreProductRepository();

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

    const serializedProducts = products.map((p) => ({
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
    })) as Product[];

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

    const serializedProduct = {
      ...product,
      createdAt: product.createdAt
        ? new Date(product.createdAt).toISOString()
        : undefined,
      updatedAt: product.updatedAt
        ? new Date(product.updatedAt).toISOString()
        : undefined,
    } as Product;

    return {
      success: true,
      data: serializedProduct,
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

    const serializedProduct = {
      ...product,
      createdAt: product.createdAt
        ? new Date(product.createdAt).toISOString()
        : undefined,
      updatedAt: product.updatedAt
        ? new Date(product.updatedAt).toISOString()
        : undefined,
    } as Product;

    return {
      success: true,
      data: serializedProduct,
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
    const useCase = new UpdateProductUseCase(productRepository);
    const product = await useCase.execute(input);

    const serializedProduct = {
      ...product,
      createdAt: product.createdAt
        ? new Date(product.createdAt).toISOString()
        : undefined,
      updatedAt: product.updatedAt
        ? new Date(product.updatedAt).toISOString()
        : undefined,
    } as Product;

    return {
      success: true,
      data: serializedProduct,
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
