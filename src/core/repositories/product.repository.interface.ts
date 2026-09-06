import type { Product, ProductFilter } from "@/core/schemas/product.schema";

export interface IProductRepository {
  findAll(
    filter?: ProductFilter,
  ): Promise<{ data: Product[]; totalCount: number }>;

  findById(id: string): Promise<Product | null>;

  findByBarcode(barcode: string): Promise<Product | null>;

  create(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product>;

  createOrIncrementByBarcode(
    barcode: string,
    draftFactory: () => Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ product: Product; created: boolean }>;

  update(id: string, product: Partial<Product>): Promise<Product>;

  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
