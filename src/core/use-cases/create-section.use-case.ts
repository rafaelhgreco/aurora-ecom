import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import { parseOrThrow } from "@/core/schemas/parse-or-throw";
import {
  type CreateSectionInput,
  createSectionSchema,
  type Section,
} from "@/core/schemas/section.schema";
import { ValidationError } from "@/shared/errors/domain-errors";

export class CreateSectionUseCase {
  constructor(private readonly sectionRepository: ISectionRepository) {}

  async execute(input: CreateSectionInput): Promise<Section> {
    const validatedData = parseOrThrow(
      createSectionSchema,
      input,
      "Dados de seção inválidos",
    );

    const existingByName =
      await this.sectionRepository.findByNameCaseInsensitive(
        validatedData.name,
      );
    if (existingByName) {
      throw new ValidationError("Dados de seção inválidos", [
        { field: "name", message: "Já existe uma seção com esse nome." },
      ]);
    }

    const existingBySlug = await this.sectionRepository.findBySlug(
      validatedData.slug,
    );
    if (existingBySlug) {
      throw new ValidationError("Dados de seção inválidos", [
        { field: "slug", message: "Essa URL já está em uso, escolha outra." },
      ]);
    }

    return this.sectionRepository.create(validatedData);
  }
}
