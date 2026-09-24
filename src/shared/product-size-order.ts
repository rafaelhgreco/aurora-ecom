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

const OPTION_GROUP_NUMERIC = 0;
const OPTION_GROUP_CLOTHING = 1;
const OPTION_GROUP_VOLUME = 2;
const OPTION_GROUP_OTHER = 3;

function sizeOptionGroup(size: string): number {
  if (VOLUME_INDEX.has(size)) return OPTION_GROUP_VOLUME;
  if (CLOTHING_INDEX.has(size)) return OPTION_GROUP_CLOTHING;
  if (parseLeadingNumber(size) !== null) return OPTION_GROUP_NUMERIC;
  return OPTION_GROUP_OTHER;
}

function compareSizeOptions(a: string, b: string): number {
  const groupA = sizeOptionGroup(a);
  const groupB = sizeOptionGroup(b);
  if (groupA !== groupB) return groupA - groupB;

  switch (groupA) {
    case OPTION_GROUP_NUMERIC:
      return (parseLeadingNumber(a) ?? 0) - (parseLeadingNumber(b) ?? 0);
    case OPTION_GROUP_CLOTHING:
      return (CLOTHING_INDEX.get(a) ?? 0) - (CLOTHING_INDEX.get(b) ?? 0);
    case OPTION_GROUP_VOLUME:
      return (VOLUME_INDEX.get(a) ?? 0) - (VOLUME_INDEX.get(b) ?? 0);
    default:
      return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
  }
}

/**
 * Ordena a lista global de tamanhos (de produtos de tipos diferentes) por
 * grupos: numéricos (35, 36…) → roupas (PP→XG) → volumes (100ml→1000ml) →
 * demais (combo, "Único"…, alfabético). Diferente de `sortSizes`, que decide a
 * ordem pelo conjunto inteiro e serve a um único produto. Não muta o array.
 */
export function sortSizeOptions(sizes: string[]): string[] {
  return [...sizes].sort(compareSizeOptions);
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
