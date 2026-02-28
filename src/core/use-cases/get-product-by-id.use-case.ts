import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { Product } from "@/core/schemas/product.schema";
import { NotFoundError } from "@/shared/errors/domain-errors";

export class GetProductByIdUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    if (!id || id.trim() === "") {
      throw new Error("ID do produto é obrigatório");
    }

    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundError("Produto", id);
    }

    return product;
  }
}
