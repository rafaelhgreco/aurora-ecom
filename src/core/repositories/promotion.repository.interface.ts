import type { Promotion } from "@/core/schemas/promotion.schema";

export interface IPromotionRepository {
  findAll(): Promise<Promotion[]>;

  findById(id: string): Promise<Promotion | null>;

  /** Firestore não tem `where` case-insensitive; implementações comparam em memória. */
  findByNameCaseInsensitive(name: string): Promise<Promotion | null>;

  create(
    promotion: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
  ): Promise<Promotion>;

  update(id: string, promotion: Partial<Promotion>): Promise<Promotion>;

  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
