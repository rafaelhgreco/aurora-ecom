import type { Section } from "@/core/schemas/section.schema";

export interface ISectionRepository {
  findAll(): Promise<Section[]>;

  findById(id: string): Promise<Section | null>;

  findBySlug(slug: string): Promise<Section | null>;

  /** Firestore não tem `where` case-insensitive; implementações comparam em memória. */
  findByNameCaseInsensitive(name: string): Promise<Section | null>;

  create(
    section: Omit<Section, "id" | "createdAt" | "updatedAt">,
  ): Promise<Section>;

  update(id: string, section: Partial<Section>): Promise<Section>;

  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
