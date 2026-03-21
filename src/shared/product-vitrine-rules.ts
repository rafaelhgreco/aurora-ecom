/**
 * Regras para pausar produto na vitrine (isActive = false) sem afetar listagem.
 */

function getEffectiveStock(params: {
  stock: number;
  stockBySize?: Partial<Record<string, number>> | null;
  sizes?: string[] | null | undefined;
}): number {
  if (params.stockBySize && params.sizes && params.sizes.length > 0) {
    return params.sizes.reduce(
      (sum, s) => sum + (params.stockBySize?.[s] ?? 0),
      0,
    );
  }
  return params.stock;
}

export function canPauseProductOnVitrine(params: {
  stock: number;
  stockBySize?: Partial<Record<string, number>> | null;
  sizes?: string[] | null | undefined;
}): boolean {
  const sizes = params.sizes ?? [];
  const totalStock = getEffectiveStock(params);
  return totalStock === 0 && sizes.length === 0;
}

export function pauseProductOnVitrineBlockedReason(params: {
  stock: number;
  stockBySize?: Partial<Record<string, number>> | null;
  sizes?: string[] | null | undefined;
}): string {
  const totalStock = getEffectiveStock(params);
  if (totalStock > 0) {
    return "Para pausar na vitrine, o estoque deve estar zerado.";
  }
  const sizes = params.sizes ?? [];
  if (sizes.length > 0) {
    return "Para pausar na vitrine, remova todos os tamanhos do cadastro do produto.";
  }
  return "";
}
