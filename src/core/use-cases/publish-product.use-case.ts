import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import { parseOrThrow } from "@/core/schemas/parse-or-throw";
import {
  type Product,
  type PublishProductInput,
  publishProductSchema,
} from "@/core/schemas/product.schema";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import { UpdateProductUseCase } from "./update-product.use-case";

export class PublishProductUseCase {
  private readonly updateUseCase: UpdateProductUseCase;

  constructor(private readonly productRepository: IProductRepository) {
    this.updateUseCase = new UpdateProductUseCase(productRepository);
  }

  async execute(input: PublishProductInput): Promise<Product> {
    const validated = parseOrThrow(
      publishProductSchema,
      input,
      "Dados de publicação inválidos",
    );

    const current = await this.productRepository.findById(validated.id);
    if (!current) {
      throw new NotFoundError("Produto", validated.id);
    }

    if (current.status !== "DRAFT") {
      throw new ValidationError("Produto já está publicado.", [
        { field: "id", message: "Produto não está em rascunho" },
      ]);
    }

    return this.updateUseCase.execute({
      id: validated.id,
      title: validated.title,
      ...(validated.slug !== undefined ? { slug: validated.slug } : {}),
      price: validated.price,
      category: validated.category,
      status: "ACTIVE",
    });
  }
}
