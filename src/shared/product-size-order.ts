import {
  PRODUCT_SIZES_CLOTHING,
  PRODUCT_SIZES_VOLUME,
} from "@/core/schemas/product.schema";

function buildIndex(order: readonly string[]): Map<string, number> {
  return new Map(order.map((size, index) => [size, index]));
}

const CLOTHING_INDEX = buildIndex(PRODUCT_SIZES_CLOTHING);
const VOLUME_INDEX = buildIndex(PRODUCT_SIZES_VOLUME);

function allIn(sizes: string[], index: Map<string, number>): boolean {
  return sizes.length > 0 && sizes.every((s) => index.has(s));
}

/** "500ml" -> 500, "34" -> 34, "Único" -> null */
function parseLeadingNumber(size: string): number | null {
  const match = size.match(/^(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Ordena tamanhos de forma previsível para exibição/persistência:
 * preset de roupas (PP→XG) ou volumes (100ml→1000ml) quando aplicável,
 * senão ordem numérica (tamanhos personalizados numéricos), senão alfabética.
 * Nunca muta o array recebido.
 */
export function sortSizes(sizes: string[]): string[] {
  if (sizes.length <= 1) return [...sizes];

  if (allIn(sizes, CLOTHING_INDEX)) {
    return [...sizes].sort(
      (a, b) => (CLOTHING_INDEX.get(a) ?? 0) - (CLOTHING_INDEX.get(b) ?? 0),
    );
  }

  if (allIn(sizes, VOLUME_INDEX)) {
    return [...sizes].sort(
      (a, b) => (VOLUME_INDEX.get(a) ?? 0) - (VOLUME_INDEX.get(b) ?? 0),
    );
  }

  const numericValues = sizes.map(parseLeadingNumber);
  if (numericValues.every((n) => n !== null)) {
    return [...sizes].sort(
      (a, b) => (parseLeadingNumber(a) ?? 0) - (parseLeadingNumber(b) ?? 0),
    );
  }

  return [...sizes].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
  );
}
