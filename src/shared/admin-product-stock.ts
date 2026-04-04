import type { ProductSize } from "@/core/schemas/product.schema";

/**
 * Monta `stockBySize` da variante a partir dos tamanhos selecionados no formulário.
 * Inclui todos os tamanhos escolhidos (0 permitido) para manter consistência com `hasVariantLevelStock`.
 */
export function buildVariantStockBySize(
  row: Partial<Record<ProductSize, number>>,
  selectedSizes: ProductSize[],
): Record<ProductSize, number> | undefined {
  if (selectedSizes.length === 0) return undefined;
  const out = {} as Record<ProductSize, number>;
  for (const s of selectedSizes) {
    const n = Math.max(0, Math.floor(Number(row[s] ?? 0)));
    out[s] = n;
  }
  return out;
}
