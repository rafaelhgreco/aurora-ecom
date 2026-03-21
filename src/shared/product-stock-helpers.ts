/**
 * Helpers para estoque de produto (com ou sem stockBySize).
 * Uso em componentes que recebem Product serializado (sem entity).
 */

import type { ProductSize } from "@/core/schemas/product.schema";

export function getAvailableSizes(product: {
  sizes?: ProductSize[] | null;
  stock?: number;
  stockBySize?: Partial<Record<ProductSize, number>> | null;
}): ProductSize[] {
  const sizes = product.sizes ?? [];
  if (sizes.length === 0) return [];

  if (product.stockBySize) {
    const sb = product.stockBySize;
    return sizes.filter((s) => (sb[s as keyof typeof sb] ?? 0) > 0);
  }
  return (product.stock ?? 0) > 0 ? sizes : [];
}

export function getStockForSize(
  product: {
    stock?: number;
    stockBySize?: Partial<Record<ProductSize, number>> | null;
    sizes?: ProductSize[] | null;
  },
  size: ProductSize,
): number {
  if (product.stockBySize && product.sizes?.includes(size)) {
    return product.stockBySize[size as keyof typeof product.stockBySize] ?? 0;
  }
  return product.stock ?? 0;
}

export function getTotalStock(product: {
  stock?: number;
  stockBySize?: Partial<Record<ProductSize, number>> | null;
  sizes?: ProductSize[] | null;
}): number {
  if (product.stockBySize && product.sizes && product.sizes.length > 0) {
    const sb = product.stockBySize;
    return product.sizes.reduce(
      (sum, s) => sum + (sb[s as keyof typeof sb] ?? 0),
      0,
    );
  }
  return product.stock ?? 0;
}
