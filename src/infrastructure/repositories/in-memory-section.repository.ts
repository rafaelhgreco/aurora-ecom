import { randomUUID } from "node:crypto";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import type { Section } from "@/core/schemas/section.schema";

export class InMemorySectionRepository implements ISectionRepository {
  private sections: Section[];

  constructor(seed: Section[] = []) {
    this.sections = [...seed];
  }

  async findAll(): Promise<Section[]> {
    return [...this.sections].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Section | null> {
    return this.sections.find((s) => s.id === id) || null;
  }

  async findBySlug(slug: string): Promise<Section | null> {
    return this.sections.find((s) => s.slug === slug) || null;
  }

  async findByNameCaseInsensitive(name: string): Promise<Section | null> {
    const needle = name.trim().toLowerCase();
    return (
      this.sections.find((s) => s.name.trim().toLowerCase() === needle) || null
    );
  }

  async create(
    section: Omit<Section, "id" | "createdAt" | "updatedAt">,
  ): Promise<Section> {
    const newSection: Section = {
      ...section,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sections.push(newSection);
    return newSection;
  }

  async update(id: string, updates: Partial<Section>): Promise<Section> {
    const index = this.sections.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Seção com ID ${id} não encontrada`);
    }

    this.sections[index] = {
      ...this.sections[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    return this.sections[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.sections.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Seção com ID ${id} não encontrada`);
    }

    this.sections.splice(index, 1);
  }

  async exists(id: string): Promise<boolean> {
    return this.sections.some((s) => s.id === id);
  }
}
