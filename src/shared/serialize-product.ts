import type { Product } from "@/core/schemas/product.schema";

export function serializeProductForClient(p: Product): Product {
  return {
    ...p,
    createdAt: p.createdAt
      ? new Date(p.createdAt as Date | string).toISOString()
      : undefined,
    updatedAt: p.updatedAt
      ? new Date(p.updatedAt as Date | string).toISOString()
      : undefined,
  } as Product;
}
