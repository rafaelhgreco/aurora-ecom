import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { IPromotionRepository } from "@/core/repositories/promotion.repository.interface";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

export interface BulkUpdateProductPromotionInput {
  productIds: string[];
  /** Promoção de destino (id). `null` remove a promoção dos produtos selecionados. */
  promotionId: string | null;
}

export interface BulkUpdateProductPromotionResult {
  updatedCount: number;
  failedIds: string[];
}

/**
 * Associa ou remove em massa a promoção de vários produtos (tela de
 * gerenciamento de produtos de uma promoção).
 */
export class BulkUpdateProductPromotionUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly promotionRepository: IPromotionRepository,
  ) {}

  async execute(
    input: BulkUpdateProductPromotionInput,
  ): Promise<BulkUpdateProductPromotionResult> {
    const { productIds, promotionId } = input;

    if (productIds.length === 0) {
      throw new ValidationError("Selecione ao menos um produto", [
        { field: "productIds", message: "Nenhum produto selecionado" },
      ]);
    }

    if (promotionId !== null) {
      const exists = await this.promotionRepository.exists(promotionId);
      if (!exists) {
        throw new NotFoundError("Promoção", promotionId);
      }
    }

    const uniqueIds = [...new Set(productIds)];

    return this.productRepository.bulkUpdatePromotion(uniqueIds, promotionId);
  }
}
