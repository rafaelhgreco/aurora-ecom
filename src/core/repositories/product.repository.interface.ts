import type { Product, ProductFilter } from "@/core/schemas/product.schema";

export interface IProductRepository {
  findAll(
    filter?: ProductFilter,
  ): Promise<{ data: Product[]; totalCount: number }>;

  findById(id: string): Promise<Product | null>;

  create(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product>;

  update(id: string, product: Partial<Product>): Promise<Product>;

  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
