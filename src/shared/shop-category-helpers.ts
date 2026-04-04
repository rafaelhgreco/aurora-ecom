/**
 * Helpers para `shopCategory` do produto (alinha drawer, breadcrumb e filtros).
 */

import type { ShopCategoryId } from "@/core/catalog/shop-catalog";
import type { Product } from "@/core/schemas/product.schema";

/** Produtos sem campo no Firestore contam como Roupas (comportamento do repositório). */
export function getEffectiveShopCategory(product: Product): ShopCategoryId {
  return product.shopCategory === "cabelos" ? "cabelos" : "roupas";
}
