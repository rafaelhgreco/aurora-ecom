import {
  PRODUCT_SIZES_CLOTHING,
  PRODUCT_SIZES_VOLUME,
} from "@/core/schemas/product.schema";
import { sortSizeOptions } from "@/shared/product-size-order";

/** Parâmetros de query dos filtros da loja (`/loja/[slug]?sub=…&tam=…&pagina=…`). */
export const SHOP_FILTER_PARAM = {
  section: "secao",
  category: "sub",
  size: "tam",
  page: "pagina",
  sort: "ordem",
} as const;

export type ShopSortDirection = "asc" | "desc";

export interface ShopFilterState {
  /** Só usado no hub `/loja` (multisseleção de seções). */
  sectionIds: string[];
  categoryNames: string[];
  sizeKeys: string[];
  page: number;
  /** Só usado no hub `/loja`; "asc" (A→Z) é o padrão e não vai para a URL. */
  sortDirection: ShopSortDirection;
}

export interface SizeOption {
  /** Chave de comparação (`sizeKey`) — é o que vai na URL. */
  key: string;
  /** Rótulo de exibição. */
  label: string;
  /** Quantidade de produtos que possuem o tamanho. */
  count: number;
}

interface FilterableProduct {
  category?: string | null;
  sizes?: string[] | null;
}

const PRESET_LABEL_BY_KEY = new Map(
  [...PRODUCT_SIZES_CLOTHING, ...PRODUCT_SIZES_VOLUME].map((size) => [
    sizeKey(size),
    size,
  ]),
);

/** Chave de comparação: "m", "M" e " M " são o mesmo tamanho. */
export function sizeKey(size: string): string {
  return size.trim().toLowerCase();
}

/**
 * Tamanhos distintos dos produtos, com contagem, ordenados por
 * `sortSizeOptions`. Tamanhos que só diferem em caixa/espaços viram uma opção;
 * o rótulo é o do preset (ex.: "M") ou, senão, o mais frequente.
 */
export function buildSizeOptions(products: FilterableProduct[]): SizeOption[] {
  const byKey = new Map<
    string,
    { count: number; labels: Map<string, number> }
  >();

  for (const product of products) {
    const seenKeys = new Set<string>();
    for (const raw of product.sizes ?? []) {
      const label = raw.trim();
      const key = sizeKey(label);
      if (!key || seenKeys.has(key)) continue;
      seenKeys.add(key);

      const entry = byKey.get(key) ?? { count: 0, labels: new Map() };
      entry.count += 1;
      entry.labels.set(label, (entry.labels.get(label) ?? 0) + 1);
      byKey.set(key, entry);
    }
  }

  const options = new Map<string, SizeOption>();
  for (const [key, { count, labels }] of byKey) {
    const mostFrequent = [...labels.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0][0];
    options.set(key, {
      key,
      label: PRESET_LABEL_BY_KEY.get(key) ?? mostFrequent,
      count,
    });
  }

  const labelToKey = new Map<string, string>();
  for (const option of options.values())
    labelToKey.set(option.label, option.key);

  return sortSizeOptions([...labelToKey.keys()]).flatMap((label) => {
    const key = labelToKey.get(label);
    const option = key ? options.get(key) : undefined;
    return option ? [option] : [];
  });
}

/**
 * Subcategoria (OR interno) E tamanho (OR interno). Conjunto vazio = sem filtro
 * naquele grupo.
 */
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  filters: { categoryNames: Set<string>; sizeKeys: Set<string> },
): T[] {
  const { categoryNames, sizeKeys } = filters;
  if (categoryNames.size === 0 && sizeKeys.size === 0) return products;

  return products.filter((product) => {
    if (
      categoryNames.size > 0 &&
      !(product.category && categoryNames.has(product.category))
    ) {
      return false;
    }
    if (
      sizeKeys.size > 0 &&
      !(product.sizes ?? []).some((size) => sizeKeys.has(sizeKey(size)))
    ) {
      return false;
    }
    return true;
  });
}

function uniqueNonEmpty(values: string[], normalize: (v: string) => string) {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

export function parseFilterParams(params: URLSearchParams): ShopFilterState {
  const page = Number.parseInt(params.get(SHOP_FILTER_PARAM.page) ?? "", 10);
  return {
    sectionIds: uniqueNonEmpty(params.getAll(SHOP_FILTER_PARAM.section), (v) =>
      v.trim(),
    ),
    categoryNames: uniqueNonEmpty(
      params.getAll(SHOP_FILTER_PARAM.category),
      (v) => v.trim(),
    ),
    sizeKeys: uniqueNonEmpty(params.getAll(SHOP_FILTER_PARAM.size), sizeKey),
    page: Number.isFinite(page) && page > 1 ? page : 1,
    sortDirection:
      params.get(SHOP_FILTER_PARAM.sort) === "desc" ? "desc" : "asc",
  };
}

/** Query string (sem "?") — omite grupos vazios e `pagina=1`. */
export function buildFilterQuery(state: ShopFilterState): string {
  const params = new URLSearchParams();
  for (const id of state.sectionIds) {
    params.append(SHOP_FILTER_PARAM.section, id);
  }
  for (const name of state.categoryNames) {
    params.append(SHOP_FILTER_PARAM.category, name);
  }
  for (const key of state.sizeKeys) {
    params.append(SHOP_FILTER_PARAM.size, key);
  }
  if (state.page > 1) {
    params.set(SHOP_FILTER_PARAM.page, String(state.page));
  }
  if (state.sortDirection === "desc") {
    params.set(SHOP_FILTER_PARAM.sort, "desc");
  }
  return params.toString();
}
