/**
 * Helpers para `shopCategory` do produto (alinha drawer, breadcrumb e filtros).
 */

import {
  SHOP_CATALOG_ROUTES,
  SHOP_CATEGORY_IDS,
  SHOP_CATEGORY_LABELS,
  type ShopCategoryId,
} from "@/core/catalog/shop-catalog";
import type { Product } from "@/core/schemas/product.schema";

/** Produtos sem campo no Firestore contam como Roupas (comportamento do repositório). */
export function getEffectiveShopCategory(product: Product): ShopCategoryId {
  return product.shopCategory === "cabelos" ? "cabelos" : "roupas";
}

function sortProductsByTitlePt(a: Product, b: Product): number {
  return (a.title || "").localeCompare(b.title || "", "pt-BR", {
    sensitivity: "base",
  });
}

/** Lista única ordenada alfabeticamente (ex.: página de uma seção). */
export function sortProductsAlphabetically(products: Product[]): Product[] {
  return [...products].sort(sortProductsByTitlePt);
}

export type ShopSectionGroup = {
  shopCategory: ShopCategoryId;
  sectionTitle: string;
  products: Product[];
};

/**
 * Agrupa por seção da loja (Roupas, Produtos Aurora, …) na ordem do catálogo;
 * dentro de cada seção, ordena pelo título (pt-BR).
 */
export function groupProductsByShopSectionSorted(
  products: Product[],
): ShopSectionGroup[] {
  const buckets = new Map<ShopCategoryId, Product[]>();
  for (const id of SHOP_CATEGORY_IDS) {
    buckets.set(id, []);
  }
  for (const p of products) {
    const cat = getEffectiveShopCategory(p);
    buckets.get(cat)?.push(p);
  }

  const out: ShopSectionGroup[] = [];
  for (const id of SHOP_CATEGORY_IDS) {
    const raw = buckets.get(id) ?? [];
    if (raw.length === 0) continue;
    const sorted = [...raw].sort(sortProductsByTitlePt);
    const route = SHOP_CATALOG_ROUTES.find((r) => r.shopCategory === id);
    const sectionTitle = route?.title ?? SHOP_CATEGORY_LABELS[id];
    out.push({ shopCategory: id, sectionTitle, products: sorted });
  }
  return out;
}
