/**
 * Catálogo da loja: rotas públicas e vínculo com `shopCategory` no produto.
 */

export const SHOP_CATEGORY_IDS = ["roupas", "cabelos"] as const;
export type ShopCategoryId = (typeof SHOP_CATEGORY_IDS)[number];

export type ShopCatalogRoute = {
  readonly slug: string;
  readonly shopCategory: ShopCategoryId;
  readonly title: string;
  readonly description: string;
};

/** Rotas fixas: /shop/[slug] */
export const SHOP_CATALOG_ROUTES: readonly ShopCatalogRoute[] = [
  {
    slug: "roupas",
    shopCategory: "roupas",
    title: "Roupas",
    description: "Peças e coleções de vestuário.",
  },
  {
    slug: "produtos-aurora",
    shopCategory: "cabelos",
    title: "Produtos Aurora",
    description: "Linha Cabelos e Produtos Aurora.",
  },
] as const;

export function getShopCatalogBySlug(
  slug: string,
): ShopCatalogRoute | undefined {
  return SHOP_CATALOG_ROUTES.find((r) => r.slug === slug);
}

export function isShopCatalogSlug(slug: string): boolean {
  return SHOP_CATALOG_ROUTES.some((r) => r.slug === slug);
}

/** Rótulos para o painel admin (campo `shopCategory`) */
export const SHOP_CATEGORY_LABELS: Record<ShopCategoryId, string> = {
  roupas: "Roupas",
  cabelos: "Produtos Aurora (Cabelos)",
};
