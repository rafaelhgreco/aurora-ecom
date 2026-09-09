import type { IPromotionRepository } from "@/core/repositories/promotion.repository.interface";
import { parseOrThrow } from "@/core/schemas/parse-or-throw";
import {
  type Promotion,
  type UpdatePromotionInput,
  updatePromotionSchema,
} from "@/core/schemas/promotion.schema";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

/**
 * Promoção é referenciada por id (não por nome, ver `product.promotionId`) —
 * diferente de categoria, renomear aqui não exige sincronizar produtos.
 */
export class UpdatePromotionUseCase {
  constructor(private readonly promotionRepository: IPromotionRepository) {}

  async execute(input: UpdatePromotionInput): Promise<Promotion> {
    const validatedData = parseOrThrow(
      updatePromotionSchema,
      input,
      "Dados de atualização inválidos",
    );

    const current = await this.promotionRepository.findById(validatedData.id);
    if (!current) {
      throw new NotFoundError("Promoção", validatedData.id);
    }

    if (validatedData.name !== undefined) {
      const existing = await this.promotionRepository.findByNameCaseInsensitive(
        validatedData.name,
      );
      if (existing && existing.id !== validatedData.id) {
        throw new ValidationError("Dados de promoção inválidos", [
          { field: "name", message: "Já existe uma promoção com esse nome." },
        ]);
      }
    }

    const { id, ...updates } = validatedData;
    return this.promotionRepository.update(id, updates);
  }
}
