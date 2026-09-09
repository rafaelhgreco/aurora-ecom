import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { IPromotionRepository } from "@/core/repositories/promotion.repository.interface";
import { DomainError, NotFoundError } from "@/shared/errors/domain-errors";

/**
 * Use Case: Deletar promoção
 *
 * Bloqueia a exclusão se algum produto ainda referencia a promoção (via
 * `product.promotionId`), evitando produtos órfãos apontando para um id
 * inexistente.
 */
export class DeletePromotionUseCase {
  constructor(
    private readonly promotionRepository: IPromotionRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) {
      throw new NotFoundError("Promoção", id);
    }

    const { totalCount } = await this.productRepository.findAll({
      promotionId: id,
      limitCount: 1,
    });

    if (totalCount > 0) {
      throw new DomainError(
        `Promoção em uso por ${totalCount} produto${totalCount > 1 ? "s" : ""}, não é possível excluir.`,
      );
    }

    await this.promotionRepository.delete(id);
  }
}
