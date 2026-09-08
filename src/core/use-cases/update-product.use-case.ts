import { ZodError } from "zod";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import {
  type Product,
  type UpdateProductInput,
  updateProductSchema,
} from "@/core/schemas/product.schema";
import { normalizeUpdateProductInput } from "@/core/schemas/product-normalize";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import { isValidSlugFormat } from "@/shared/slugify";

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: UpdateProductInput): Promise<Product> {
    try {
      const validatedData = updateProductSchema.parse(
        normalizeUpdateProductInput(input),
      );

      const exists = await this.productRepository.exists(validatedData.id);
      if (!exists) {
        throw new NotFoundError("Produto", validatedData.id);
      }

      if (validatedData.slug !== undefined) {
        await this.validateSlugUniqueness(validatedData.slug, validatedData.id);
      }

      const { id, ...updates } = validatedData;
      const product = await this.productRepository.update(id, updates);

      return product;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          "Dados de atualização inválidos",
          error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        );
      }

      throw error;
    }
  }

  private async validateSlugUniqueness(
    slug: string,
    productId: string,
  ): Promise<void> {
    if (!isValidSlugFormat(slug)) {
      throw new ValidationError("Dados de atualização inválidos", [
        { field: "slug", message: "Formato de URL inválido" },
      ]);
    }
    const existing = await this.productRepository.findBySlug(slug);
    if (existing && existing.id !== productId) {
      throw new ValidationError("Dados de atualização inválidos", [
        { field: "slug", message: "Essa URL já está em uso, escolha outra." },
      ]);
    }
  }
}
