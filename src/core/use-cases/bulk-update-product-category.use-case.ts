import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import { productCategoryValueSchema } from "@/core/schemas/product.schema";
import { ValidationError } from "@/shared/errors/domain-errors";

export interface BulkUpdateProductCategoryInput {
  productIds: string[];
  /** Subcategoria de destino (nome). `""` limpa ("Nenhuma"). */
  category: string;
}

export interface BulkUpdateProductCategoryResult {
  updatedCount: number;
  failedIds: string[];
}

/**
 * Move ou limpa em massa a subcategoria de vários produtos (painel de
 * gerenciamento de produtos de uma subcategoria).
 */
export class BulkUpdateProductCategoryUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(
    input: BulkUpdateProductCategoryInput,
  ): Promise<BulkUpdateProductCategoryResult> {
    const { productIds, category } = input;

    if (productIds.length === 0) {
      throw new ValidationError("Selecione ao menos um produto", [
        { field: "productIds", message: "Nenhum produto selecionado" },
      ]);
    }

    const parsedCategory = productCategoryValueSchema.safeParse(category);
    if (!parsedCategory.success) {
      throw new ValidationError("Categoria de destino inválida", [
        {
          field: "category",
          message: parsedCategory.error.issues[0]?.message ?? "Inválida",
        },
      ]);
    }

    const uniqueIds = [...new Set(productIds)];

    return this.productRepository.bulkUpdateCategory(
      uniqueIds,
      parsedCategory.data ?? "",
    );
  }
}
