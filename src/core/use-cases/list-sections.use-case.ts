import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import type { Section } from "@/core/schemas/section.schema";

export class ListSectionsUseCase {
  constructor(private readonly sectionRepository: ISectionRepository) {}

  async execute(): Promise<Section[]> {
    return this.sectionRepository.findAll();
  }
}
