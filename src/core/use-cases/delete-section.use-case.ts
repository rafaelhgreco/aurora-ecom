import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import { DomainError, NotFoundError } from "@/shared/errors/domain-errors";

/**
 * Use Case: Deletar seção
 *
 * Bloqueia a exclusão se a seção ainda tem subcategorias vinculadas, ou se
 * algum produto referencia a seção diretamente (via `product.shopCategory`,
 * caso de produtos sem subcategoria definida).
 */
export class DeleteSectionUseCase {
  constructor(
    private readonly sectionRepository: ISectionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const section = await this.sectionRepository.findById(id);
    if (!section) {
      throw new NotFoundError("Seção", id);
    }

    const categories = await this.categoryRepository.findAll();
    const linkedCategories = categories.filter((c) => c.sectionId === id);
    if (linkedCategories.length > 0) {
      throw new DomainError(
        `Seção possui ${linkedCategories.length} subcategoria${linkedCategories.length > 1 ? "s" : ""} vinculada${linkedCategories.length > 1 ? "s" : ""}, não é possível excluir.`,
      );
    }

    const { totalCount } = await this.productRepository.findAll({
      shopCategory: id,
      limitCount: 1,
    });
    if (totalCount > 0) {
      throw new DomainError(
        `Seção em uso por ${totalCount} produto${totalCount > 1 ? "s" : ""}, não é possível excluir.`,
      );
    }

    await this.sectionRepository.delete(id);
  }
}
