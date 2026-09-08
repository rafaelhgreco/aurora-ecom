import { ZodError } from "zod";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
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
    let validated: PublishProductInput;

    try {
      validated = publishProductSchema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          "Dados de publicação inválidos",
          error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        );
      }
      throw error;
    }

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
