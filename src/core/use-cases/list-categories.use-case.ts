import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { Category } from "@/core/schemas/category.schema";

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }
}
