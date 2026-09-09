import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import { parseOrThrow } from "@/core/schemas/parse-or-throw";
import type { Product } from "@/core/schemas/product.schema";
import { productPromotionOverridePriceSchema } from "@/core/schemas/product.schema";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

export interface SetProductPromotionOverridePriceInput {
  productId: string;
  /** `null` limpa o override (o desconto volta a incidir sobre `price`). */
  overridePrice: number | null;
}

/**
 * Define (ou limpa) o valor base específico de um produto dentro da
 * promoção à qual ele já está associado — cobre o modo "editar o valor e
 * depois aplicar o percentual".
 */
export class SetProductPromotionOverridePriceUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(
    input: SetProductPromotionOverridePriceInput,
  ): Promise<Product> {
    const overridePrice = parseOrThrow(
      productPromotionOverridePriceSchema,
      input.overridePrice,
      "Valor base inválido",
    );

    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new NotFoundError("Produto", input.productId);
    }

    if (!product.promotionId) {
      throw new ValidationError("Produto sem promoção associada", [
        {
          field: "productId",
          message:
            "Associe o produto a uma promoção antes de definir um valor base.",
        },
      ]);
    }

    return this.productRepository.update(input.productId, {
      promotionOverridePrice: overridePrice,
    });
  }
}
