import { ZodError } from "zod";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import {
  type Section,
  type UpdateSectionInput,
  updateSectionSchema,
} from "@/core/schemas/section.schema";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";

export class UpdateSectionUseCase {
  constructor(private readonly sectionRepository: ISectionRepository) {}

  async execute(input: UpdateSectionInput): Promise<Section> {
    try {
      const validatedData = updateSectionSchema.parse(input);

      const exists = await this.sectionRepository.exists(validatedData.id);
      if (!exists) {
        throw new NotFoundError("Seção", validatedData.id);
      }

      if (validatedData.name !== undefined) {
        const existing = await this.sectionRepository.findByNameCaseInsensitive(
          validatedData.name,
        );
        if (existing && existing.id !== validatedData.id) {
          throw new ValidationError("Dados de seção inválidos", [
            { field: "name", message: "Já existe uma seção com esse nome." },
          ]);
        }
      }

      if (validatedData.slug !== undefined) {
        const existing = await this.sectionRepository.findBySlug(
          validatedData.slug,
        );
        if (existing && existing.id !== validatedData.id) {
          throw new ValidationError("Dados de seção inválidos", [
            {
              field: "slug",
              message: "Essa URL já está em uso, escolha outra.",
            },
          ]);
        }
      }

      const { id, ...updates } = validatedData;
      return await this.sectionRepository.update(id, updates);
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
