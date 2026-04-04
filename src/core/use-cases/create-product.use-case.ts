import { ZodError } from "zod";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import {
  type CreateProductInput,
  createProductSchema,
  type Product,
} from "@/core/schemas/product.schema";
import { normalizeCreateProductInput } from "@/core/schemas/product-normalize";
import { ValidationError } from "@/shared/errors/domain-errors";

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    try {
      const validatedData = createProductSchema.parse(
        normalizeCreateProductInput(input),
      );

      const product = await this.productRepository.create(validatedData);

      return product;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          "Dados de produto inválidos",
          error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        );
      }

      throw error;
    }
  }
}
