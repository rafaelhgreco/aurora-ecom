import { randomUUID } from "node:crypto";
import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { Category } from "@/core/schemas/category.schema";

export class InMemoryCategoryRepository implements ICategoryRepository {
  private categories: Category[];

  constructor(seed: Category[] = []) {
    this.categories = [...seed];
  }

  async findAll(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find((c) => c.id === id) || null;
  }

  async findByNameCaseInsensitiveInSection(
    sectionId: string,
    name: string,
  ): Promise<Category | null> {
    const needle = name.trim().toLowerCase();
    return (
      this.categories.find(
        (c) =>
          c.sectionId === sectionId && c.name.trim().toLowerCase() === needle,
      ) || null
    );
  }

  async create(
    category: Omit<Category, "id" | "createdAt" | "updatedAt">,
  ): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.push(newCategory);
    return newCategory;
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const index = this.categories.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Categoria com ID ${id} não encontrada`);
    }

    this.categories[index] = {
      ...this.categories[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    return this.categories[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.categories.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Categoria com ID ${id} não encontrada`);
    }

    this.categories.splice(index, 1);
  }

  async exists(id: string): Promise<boolean> {
    return this.categories.some((c) => c.id === id);
  }
}
