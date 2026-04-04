/**
 * Helpers de estoque: produto simples, só `stockBySize`, ou variantes por cor.
 */

import type { ProductSize } from "@/core/schemas/product.schema";

/** Variante mínima para cálculo de estoque (ex.: snapshot Firestore sem `images`). */
export type ColorVariantStockLike = {
  color: string;
  stockBySize?: Partial<Record<ProductSize, number>> | null;
};

export type ProductStockLike = {
  stock?: number;
  sizes?: ProductSize[] | null;
  stockBySize?: Partial<Record<ProductSize, number>> | null;
  colorVariants?: ColorVariantStockLike[] | null;
};

export function hasVariantLevelStock(product: ProductStockLike): boolean {
  return Boolean(
    product.colorVariants?.some(
      (v) => v.stockBySize && Object.keys(v.stockBySize).length > 0,
    ),
  );
}

/** Mapa de estoque por tamanho para uma cor (ou legado no produto). */
export function getVariantStockBySizeForColor(
  product: ProductStockLike,
  color: string,
): Partial<Record<ProductSize, number>> | undefined {
  const v = product.colorVariants?.find((c) => c.color === color);
  if (!v) return product.stockBySize ?? undefined;
  if (v.stockBySize && Object.keys(v.stockBySize).length > 0) {
    return v.stockBySize;
  }
  return product.stockBySize ?? undefined;
}

export function getTotalStockForColor(
  product: ProductStockLike,
  color: string,
): number {
  const sb = getVariantStockBySizeForColor(product, color);
  if (sb && Object.keys(sb).length > 0) {
    return Object.values(sb).reduce<number>((a, b) => a + (b ?? 0), 0);
  }
  return product.stock ?? 0;
}

export function getAvailableSizes(
  product: ProductStockLike,
  color?: string,
): ProductSize[] {
  const sizes = product.sizes ?? [];

  if (hasVariantLevelStock(product)) {
    const c =
      color ??
      (product.colorVariants?.length === 1
        ? product.colorVariants[0]?.color
        : undefined);

    if (c) {
      const sb = getVariantStockBySizeForColor(product, c);
      if (sb && Object.keys(sb).length > 0) {
        return sizes.filter((s) => (sb[s] ?? 0) > 0);
      }
      return [];
    }

    const set = new Set<ProductSize>();
    for (const v of product.colorVariants ?? []) {
      if (!v.stockBySize) continue;
      for (const s of sizes) {
        if ((v.stockBySize[s] ?? 0) > 0) set.add(s);
      }
    }
    return sizes.filter((s) => set.has(s));
  }

  if (product.stockBySize && sizes.length > 0) {
    const sb = product.stockBySize;
    return sizes.filter((s) => (sb[s as keyof typeof sb] ?? 0) > 0);
  }
  return (product.stock ?? 0) > 0 ? sizes : [];
}

export function getStockForSize(
  product: ProductStockLike,
  size: ProductSize,
  color?: string,
): number {
  if (hasVariantLevelStock(product)) {
    const c =
      color ??
      (product.colorVariants?.length === 1
        ? product.colorVariants[0]?.color
        : undefined);
    if (c) {
      const sb = getVariantStockBySizeForColor(product, c);
      if (sb && Object.keys(sb).length > 0) {
        return sb[size] ?? 0;
      }
    }
  }

  if (product.stockBySize && product.sizes?.includes(size)) {
    return product.stockBySize[size as keyof typeof product.stockBySize] ?? 0;
  }
  return product.stock ?? 0;
}

export function getTotalStock(product: ProductStockLike): number {
  if (hasVariantLevelStock(product)) {
    return (product.colorVariants ?? []).reduce((sum, v) => {
      if (!v.stockBySize) return sum;
      return (
        sum +
        Object.values(v.stockBySize).reduce<number>((a, b) => a + (b ?? 0), 0)
      );
    }, 0);
  }

  if (product.stockBySize && product.sizes && product.sizes.length > 0) {
    const sb = product.stockBySize;
    return product.sizes.reduce(
      (sum, s) => sum + (sb[s as keyof typeof sb] ?? 0),
      0,
    );
  }
  return product.stock ?? 0;
}
