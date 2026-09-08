import { ZodError } from "zod";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import {
  type CreateSectionInput,
  createSectionSchema,
  type Section,
} from "@/core/schemas/section.schema";
import { ValidationError } from "@/shared/errors/domain-errors";

export class CreateSectionUseCase {
  constructor(private readonly sectionRepository: ISectionRepository) {}

  async execute(input: CreateSectionInput): Promise<Section> {
    try {
      const validatedData = createSectionSchema.parse(input);

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

      return await this.sectionRepository.create(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          "Dados de seção inválidos",
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
