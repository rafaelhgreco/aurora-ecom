import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import { parseOrThrow } from "@/core/schemas/parse-or-throw";
import {
  type CreateProductInput,
  createProductSchema,
  type Product,
} from "@/core/schemas/product.schema";
import { normalizeCreateProductInput } from "@/core/schemas/product-normalize";
import { ensureUniqueProductSlug } from "@/core/use-cases/helpers/ensure-unique-product-slug";
import { ValidationError } from "@/shared/errors/domain-errors";
import { isValidSlugFormat, slugify } from "@/shared/slugify";

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const validatedData = parseOrThrow(
      createProductSchema,
      normalizeCreateProductInput(input),
      "Dados de produto inválidos",
    );

    const slug = await this.resolveSlug(
      validatedData.slug,
      validatedData.title,
    );

    return this.productRepository.create({
      ...validatedData,
      slug,
    });
  }

  /**
   * Slug enviado (fluxo interativo do admin) é tratado como requisito de
   * unicidade e falha alto em caso de conflito. Sem slug (import em massa,
   * migração) gera silenciosamente a partir do título.
   */
  private async resolveSlug(
    slug: string | undefined,
    title: string,
  ): Promise<string> {
    if (slug) {
      if (!isValidSlugFormat(slug)) {
        throw new ValidationError("Dados de produto inválidos", [
          { field: "slug", message: "Formato de URL inválido" },
        ]);
      }
      const existing = await this.productRepository.findBySlug(slug);
      if (existing) {
        throw new ValidationError("Dados de produto inválidos", [
          { field: "slug", message: "Essa URL já está em uso, escolha outra." },
        ]);
      }
      return slug;
    }

    return ensureUniqueProductSlug(this.productRepository, slugify(title));
  }
}
