import { ZodError } from "zod";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import {
  type Product,
  type UpdateProductInput,
  updateProductSchema,
} from "@/core/schemas/product.schema";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: UpdateProductInput): Promise<Product> {
    try {
      const validatedData = updateProductSchema.parse(input);

      const exists = await this.productRepository.exists(validatedData.id);
      if (!exists) {
        throw new NotFoundError("Produto", validatedData.id);
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
}
