import type { IProductRepository } from "../repositories/product.repository.interface";

/**
 * Use Case: Deletar produto (soft delete)
 */
export class DeleteProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    if (this.productRepository.softDelete) {
      await this.productRepository.softDelete(id);
    } else {
      await this.productRepository.delete(id);
    }
  }
}
