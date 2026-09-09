import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import {
  type Category,
  type CreateCategoryInput,
  createCategorySchema,
} from "@/core/schemas/category.schema";
import { parseOrThrow } from "@/core/schemas/parse-or-throw";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

export class CreateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly sectionRepository: ISectionRepository,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const validatedData = parseOrThrow(
      createCategorySchema,
      input,
      "Dados de categoria inválidos",
    );

    const sectionExists = await this.sectionRepository.exists(
      validatedData.sectionId,
    );
    if (!sectionExists) {
      throw new NotFoundError("Seção", validatedData.sectionId);
    }

    const existing =
      await this.categoryRepository.findByNameCaseInsensitiveInSection(
        validatedData.sectionId,
        validatedData.name,
      );
    if (existing) {
      throw new ValidationError("Dados de categoria inválidos", [
        {
          field: "name",
          message: "Já existe uma subcategoria com esse nome nesta seção.",
        },
      ]);
    }

    return this.categoryRepository.create(validatedData);
  }
}
