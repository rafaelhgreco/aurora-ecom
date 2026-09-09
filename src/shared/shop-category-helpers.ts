/**
 * Helpers para `shopCategory` do produto (alinha drawer, breadcrumb e filtros).
 * Seções são cadastradas dinamicamente (coleção `sections`), não mais um enum fixo.
 *
 * Genéricos sobre o formato de data (`Product` com `Date` ou `SerializedProduct`
 * com string ISO) — estas funções só leem `title`/`shopCategory`.
 */

/** Seção seed padrão — produtos sem `shopCategory` no Firestore contam como esta seção. */
const DEFAULT_SECTION_ID = "roupas";

export function getEffectiveShopCategory(product: {
  shopCategory?: string;
}): string {
  return product.shopCategory || DEFAULT_SECTION_ID;
}

export type SortDirection = "asc" | "desc";

export function sortProductsByTitlePt<T extends { title: string }>(
  a: T,
  b: T,
  direction: SortDirection = "asc",
): number {
  const cmp = a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
  return direction === "asc" ? cmp : -cmp;
}

/** Lista única ordenada alfabeticamente (ex.: página de uma seção). */
export function sortProductsAlphabetically<T extends { title: string }>(
  products: T[],
  direction: SortDirection = "asc",
): T[] {
  return [...products].sort((a, b) => sortProductsByTitlePt(a, b, direction));
}

export type ShopSectionGroup<T> = {
  shopCategory: string;
  sectionTitle: string;
  products: T[];
};

/**
 * Agrupa por seção da loja (dinâmicas, na ordem recebida em `sections`);
 * dentro de cada seção, ordena pelo título (pt-BR).
 */
export function groupProductsByShopSectionSorted<
  T extends { title: string; shopCategory?: string },
>(
  products: T[],
  sections: Array<{ id?: string; name: string }>,
  direction: SortDirection = "asc",
): ShopSectionGroup<T>[] {
  const buckets = new Map<string, T[]>();
  for (const section of sections) {
    if (section.id) buckets.set(section.id, []);
  }
  for (const p of products) {
    const cat = getEffectiveShopCategory(p);
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)?.push(p);
  }

  const out: ShopSectionGroup<T>[] = [];
  for (const section of sections) {
    if (!section.id) continue;
    const raw = buckets.get(section.id) ?? [];
    if (raw.length === 0) continue;
    const sorted = [...raw].sort((a, b) =>
      sortProductsByTitlePt(a, b, direction),
    );
    out.push({
      shopCategory: section.id,
      sectionTitle: section.name,
      products: sorted,
    });
  }
  return out;
}
