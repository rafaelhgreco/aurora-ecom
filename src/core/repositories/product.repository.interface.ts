import type { Product, ProductFilter } from "@/core/schemas/product.schema";

export interface IProductRepository {
  findAll(
    filter?: ProductFilter,
  ): Promise<{ data: Product[]; totalCount: number }>;

  findById(id: string): Promise<Product | null>;

  findBySlug(slug: string): Promise<Product | null>;

  findByBarcode(barcode: string): Promise<Product | null>;

  create(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product>;

  /**
   * Cria um produto DRAFT para o barcode informado. Assume que o chamador já
   * verificou que o barcode não existe (via findByBarcode) — usa escrita
   * idempotente (set), não uma criação exclusiva, para evitar que um retry de
   * rede do SDK confunda "documento já existe" com uma falha real.
   */
  createDraftByBarcode(
    barcode: string,
    draftFactory: () => Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product>;

  /**
   * Incrementa o stock de um produto já existente, localizado por barcode.
   */
  incrementStockByBarcode(
    barcode: string,
    incrementBy: number,
  ): Promise<Product>;

  update(id: string, product: Partial<Product>): Promise<Product>;

  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
