import { ZodError } from "zod";
import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import {
  type Category,
  type UpdateCategoryInput,
  updateCategorySchema,
} from "@/core/schemas/category.schema";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

/** `findAll` já busca a coleção inteira de produtos e filtra em memória
 * (ver FirestoreProductRepository) — pedir um limite alto aqui não custa
 * mais do que qualquer outra listagem já feita no admin. */
const RENAME_SYNC_LIMIT = 5000;

export class UpdateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly sectionRepository: ISectionRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    try {
      const validatedData = updateCategorySchema.parse(input);

      const current = await this.categoryRepository.findById(validatedData.id);
      if (!current) {
        throw new NotFoundError("Categoria", validatedData.id);
      }

      if (validatedData.sectionId !== undefined) {
        const sectionExists = await this.sectionRepository.exists(
          validatedData.sectionId,
        );
        if (!sectionExists) {
          throw new NotFoundError("Seção", validatedData.sectionId);
        }
      }

      if (validatedData.name !== undefined) {
        const targetSectionId = validatedData.sectionId ?? current.sectionId;
        const existing =
          await this.categoryRepository.findByNameCaseInsensitiveInSection(
            targetSectionId,
            validatedData.name,
          );
        if (existing && existing.id !== validatedData.id) {
          throw new ValidationError("Dados de categoria inválidos", [
            {
              field: "name",
              message: "Já existe uma subcategoria com esse nome nesta seção.",
            },
          ]);
        }
      }

      const { id, ...updates } = validatedData;
      const updated = await this.categoryRepository.update(id, updates);

      // Produtos referenciam a subcategoria pelo nome, não pelo id — sem
      // isso, renomear deixaria produtos existentes presos ao nome antigo
      // (órfãos, já que a subcategoria com aquele nome não existe mais).
      if (updates.name !== undefined && updates.name !== current.name) {
        const { data: affectedProducts } = await this.productRepository.findAll(
          { category: current.name, limitCount: RENAME_SYNC_LIMIT },
        );
        if (affectedProducts.length > 0) {
          await this.productRepository.bulkUpdateCategory(
            affectedProducts.map((p) => p.id as string),
            updates.name,
          );
        }
      }

      return updated;
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
