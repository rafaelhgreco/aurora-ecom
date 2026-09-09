import type { IPromotionRepository } from "@/core/repositories/promotion.repository.interface";
import { parseOrThrow } from "@/core/schemas/parse-or-throw";
import {
  type CreatePromotionInput,
  createPromotionSchema,
  type Promotion,
} from "@/core/schemas/promotion.schema";
import { ValidationError } from "@/shared/errors/domain-errors";

export class CreatePromotionUseCase {
  constructor(private readonly promotionRepository: IPromotionRepository) {}

  async execute(input: CreatePromotionInput): Promise<Promotion> {
    const validatedData = parseOrThrow(
      createPromotionSchema,
      input,
      "Dados de promoção inválidos",
    );

    const existing = await this.promotionRepository.findByNameCaseInsensitive(
      validatedData.name,
    );
    if (existing) {
      throw new ValidationError("Dados de promoção inválidos", [
        { field: "name", message: "Já existe uma promoção com esse nome." },
      ]);
    }

    return this.promotionRepository.create(validatedData);
  }
}
