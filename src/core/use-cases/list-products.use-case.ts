import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { Product, ProductFilter } from "@/core/schemas/product.schema";
import { productFilterSchema } from "@/core/schemas/product.schema";

export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(
    filter?: ProductFilter,
  ): Promise<{ data: Product[]; totalCount: number }> {
    if (filter) {
      const validatedFilter = productFilterSchema.parse(filter);
      return this.productRepository.findAll(validatedFilter);
    }

    return this.productRepository.findAll();
  }
}
