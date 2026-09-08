import { ZodError } from "zod";
import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import {
  type Category,
  type UpdateCategoryInput,
  updateCategorySchema,
} from "@/core/schemas/category.schema";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

export class UpdateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly sectionRepository: ISectionRepository,
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
      return await this.categoryRepository.update(id, updates);
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
