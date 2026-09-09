import { randomUUID } from "node:crypto";
import type { IPromotionRepository } from "@/core/repositories/promotion.repository.interface";
import type { Promotion } from "@/core/schemas/promotion.schema";

export class InMemoryPromotionRepository implements IPromotionRepository {
  private promotions: Promotion[];

  constructor(seed: Promotion[] = []) {
    this.promotions = [...seed];
  }

  async findAll(): Promise<Promotion[]> {
    return [...this.promotions].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Promotion | null> {
    return this.promotions.find((p) => p.id === id) || null;
  }

  async findByNameCaseInsensitive(name: string): Promise<Promotion | null> {
    const needle = name.trim().toLowerCase();
    return (
      this.promotions.find((p) => p.name.trim().toLowerCase() === needle) ||
      null
    );
  }

  async create(
    promotion: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
  ): Promise<Promotion> {
    const newPromotion: Promotion = {
      ...promotion,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.promotions.push(newPromotion);
    return newPromotion;
  }

  async update(id: string, updates: Partial<Promotion>): Promise<Promotion> {
    const index = this.promotions.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error(`Promoção com ID ${id} não encontrada`);
    }

    this.promotions[index] = {
      ...this.promotions[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    return this.promotions[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.promotions.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error(`Promoção com ID ${id} não encontrada`);
    }

    this.promotions.splice(index, 1);
  }

  async exists(id: string): Promise<boolean> {
    return this.promotions.some((p) => p.id === id);
  }
}
