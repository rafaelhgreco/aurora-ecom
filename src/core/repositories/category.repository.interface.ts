import type { Category } from "@/core/schemas/category.schema";

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;

  findById(id: string): Promise<Category | null>;

  /**
   * Unicidade de nome é escopada por seção (duas seções podem ter
   * subcategorias com o mesmo nome). Firestore não tem `where`
   * case-insensitive; implementações comparam em memória.
   */
  findByNameCaseInsensitiveInSection(
    sectionId: string,
    name: string,
  ): Promise<Category | null>;

  create(
    category: Omit<Category, "id" | "createdAt" | "updatedAt">,
  ): Promise<Category>;

  update(id: string, category: Partial<Category>): Promise<Category>;

  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
