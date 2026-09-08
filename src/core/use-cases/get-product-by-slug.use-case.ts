import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { Product } from "@/core/schemas/product.schema";
import { NotFoundError } from "@/shared/errors/domain-errors";

export class GetProductBySlugUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(slug: string): Promise<Product> {
    if (!slug || slug.trim() === "") {
      throw new Error("URL do produto é obrigatória");
    }

    const product = await this.productRepository.findBySlug(slug);

    if (!product) {
      throw new NotFoundError("Produto", slug);
    }

    return product;
  }
}
