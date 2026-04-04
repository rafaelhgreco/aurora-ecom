import type {
  CreateProductInput,
  ProductColorVariant,
  ProductSize,
  UpdateProductInput,
} from "./product.schema";

function aggregateFromColorVariants(
  variants: ProductColorVariant[],
  inputSizesHint?: ProductSize[],
): {
  sizes?: ProductSize[];
  stock: number;
  stockBySize?: Record<string, number>;
} {
  const sizesSet = new Set<ProductSize>();
  let totalStock = 0;
  const agg: Record<string, number> = {};

  for (const v of variants) {
    if (!v.stockBySize) continue;
    for (const [k, n] of Object.entries(v.stockBySize)) {
      if (k.length < 1 || k.length > 32) continue;
      const sz = k as ProductSize;
      sizesSet.add(sz);
      totalStock += n;
      agg[sz] = (agg[sz] ?? 0) + n;
    }
  }

  if (sizesSet.size === 0) {
    return {
      sizes: undefined,
      stock: totalStock,
      stockBySize: Object.keys(agg).length > 0 ? agg : undefined,
    };
  }

  const ordered = inputSizesHint?.filter((s) => sizesSet.has(s)) ?? [
    ...sizesSet,
  ];

  return {
    sizes: ordered,
    stock: totalStock,
    stockBySize: Object.keys(agg).length > 0 ? agg : undefined,
  };
}

function hasVariantStockData(variants: ProductColorVariant[]): boolean {
  return variants.some(
    (v) => v.stockBySize && Object.keys(v.stockBySize).length > 0,
  );
}

/**
 * Preenche `imageUrl`, `images`, `colors`, e totais agregados de estoque/tamanhos
 * a partir de `colorVariants` antes do parse Zod.
 */
export function normalizeCreateProductInput(
  input: CreateProductInput,
): CreateProductInput {
  if (input.colorVariants?.length) {
    const variants = input.colorVariants;
    const flat = [...new Set(variants.flatMap((v) => v.images))];
    const agg = aggregateFromColorVariants(variants, input.sizes);
    const hasStock = hasVariantStockData(variants);
    return {
      ...input,
      imageUrl: variants[0].images[0],
      images: flat.length > 0 ? flat : [...variants[0].images],
      colors: variants.map((v) => v.color),
      sizes: hasStock ? (agg.sizes ?? input.sizes) : input.sizes,
      stock: hasStock ? agg.stock : input.stock,
      stockBySize: hasStock
        ? (agg.stockBySize ?? input.stockBySize)
        : input.stockBySize,
    };
  }
  return input;
}

export function normalizeUpdateProductInput(
  input: UpdateProductInput,
): UpdateProductInput {
  if (input.colorVariants?.length) {
    const variants = input.colorVariants;
    const flat = [...new Set(variants.flatMap((v) => v.images))];
    const agg = aggregateFromColorVariants(variants, input.sizes);
    const hasStock = hasVariantStockData(variants);
    return {
      ...input,
      imageUrl: variants[0].images[0],
      images: flat.length > 0 ? flat : [...variants[0].images],
      colors: variants.map((v) => v.color),
      sizes: hasStock ? (agg.sizes ?? input.sizes) : input.sizes,
      stock: hasStock ? agg.stock : input.stock,
      stockBySize: hasStock
        ? (agg.stockBySize ?? input.stockBySize)
        : input.stockBySize,
    };
  }
  return input;
}
