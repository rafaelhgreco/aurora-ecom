import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import { DomainError, NotFoundError } from "@/shared/errors/domain-errors";

/**
 * Use Case: Deletar categoria
 *
 * Bloqueia a exclusão se algum produto ainda referencia a categoria (via
 * `product.category`, mesmo filtro exato já suportado pelo repositório de
 * produtos), evitando órfãos silenciosos.
 */
export class DeleteCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Categoria", id);
    }

    const { totalCount } = await this.productRepository.findAll({
      category: category.name,
      limitCount: 1,
    });

    if (totalCount > 0) {
      throw new DomainError(
        `Categoria em uso por ${totalCount} produto${totalCount > 1 ? "s" : ""}, não é possível excluir.`,
      );
    }

    await this.categoryRepository.delete(id);
  }
}
