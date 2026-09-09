import type { IPromotionRepository } from "@/core/repositories/promotion.repository.interface";
import type { Promotion } from "@/core/schemas/promotion.schema";

export class ListPromotionsUseCase {
  constructor(private readonly promotionRepository: IPromotionRepository) {}

  async execute(): Promise<Promotion[]> {
    return this.promotionRepository.findAll();
  }
}
