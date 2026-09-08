/**
 * Helpers para `shopCategory` do produto (alinha drawer, breadcrumb e filtros).
 * Seções são cadastradas dinamicamente (coleção `sections`), não mais um enum fixo.
 */

import type { Product } from "@/core/schemas/product.schema";
import type { Section } from "@/core/schemas/section.schema";

/** Seção seed padrão — produtos sem `shopCategory` no Firestore contam como esta seção. */
const DEFAULT_SECTION_ID = "roupas";

export function getEffectiveShopCategory(product: Product): string {
  return product.shopCategory || DEFAULT_SECTION_ID;
}

export type SortDirection = "asc" | "desc";

export function sortProductsByTitlePt(
  a: Product,
  b: Product,
  direction: SortDirection = "asc",
): number {
  const cmp = a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
  return direction === "asc" ? cmp : -cmp;
}

/** Lista única ordenada alfabeticamente (ex.: página de uma seção). */
export function sortProductsAlphabetically(
  products: Product[],
  direction: SortDirection = "asc",
): Product[] {
  return [...products].sort((a, b) => sortProductsByTitlePt(a, b, direction));
}

export type ShopSectionGroup = {
  shopCategory: string;
  sectionTitle: string;
  products: Product[];
};

/**
 * Agrupa por seção da loja (dinâmicas, na ordem recebida em `sections`);
 * dentro de cada seção, ordena pelo título (pt-BR).
 */
export function groupProductsByShopSectionSorted(
  products: Product[],
  sections: Section[],
  direction: SortDirection = "asc",
): ShopSectionGroup[] {
  const buckets = new Map<string, Product[]>();
  for (const section of sections) {
    if (section.id) buckets.set(section.id, []);
  }
  for (const p of products) {
    const cat = getEffectiveShopCategory(p);
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)?.push(p);
  }

  const out: ShopSectionGroup[] = [];
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
