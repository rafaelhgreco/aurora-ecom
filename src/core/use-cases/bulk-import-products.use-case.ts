import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { CreateProductInput } from "@/core/schemas/product.schema";
import { CreateProductUseCase } from "@/core/use-cases/create-product.use-case";
import { ValidationError } from "@/shared/errors/domain-errors";

export type BulkImportItem = {
  sku_base: string;
  input: CreateProductInput;
};

export type BulkImportItemFailure = {
  sku_base: string;
  error: string;
};

export type BulkImportExecuteResult = {
  created: Array<{ sku_base: string; id: string; title: string }>;
  failed: BulkImportItemFailure[];
};

export class BulkImportProductsUseCase {
  private readonly createUseCase: CreateProductUseCase;

  constructor(productRepository: IProductRepository) {
    this.createUseCase = new CreateProductUseCase(productRepository);
  }

  async execute(items: BulkImportItem[]): Promise<BulkImportExecuteResult> {
    const created: BulkImportExecuteResult["created"] = [];
    const failed: BulkImportItemFailure[] = [];

    for (const item of items) {
      try {
        const product = await this.createUseCase.execute(item.input);
        created.push({
          sku_base: item.sku_base,
          id: product.id ?? "",
          title: product.title,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          const detail = error.errors?.map((e) => e.message).join("; ");
          failed.push({
            sku_base: item.sku_base,
            error: detail ? `${error.message}: ${detail}` : error.message,
          });
        } else {
          failed.push({
            sku_base: item.sku_base,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }
    }

    return { created, failed };
  }
}
