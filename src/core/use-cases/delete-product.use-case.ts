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

    if ("softDelete" in this.productRepository) {
      // biome-ignore lint/suspicious/noExplicitAny: repository type compatibility
      await (this.productRepository as any).softDelete(id);
    } else {
      await this.productRepository.delete(id);
    }
  }
}
