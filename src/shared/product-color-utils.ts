import type { ProductColorVariant } from "@/core/schemas/product.schema";

type ProductLike = {
  colorVariants?: ProductColorVariant[];
  images?: string[];
  imageUrl?: string;
};

/**
 * Rótulo usado quando um produto não tem variação de cor (uma única galeria
 * de fotos). Compartilhado entre a leitura legada (`getEffectiveColorVariants`)
 * e o cadastro admin (toggle "tem variação de COR" desligado).
 */
export const SINGLE_COLOR_LABEL = "Único";

/**
 * Lista de cores com fotos: usa `colorVariants` ou um único bloco legado (`images`/`imageUrl`).
 */
export function getEffectiveColorVariants(
  product: ProductLike,
): ProductColorVariant[] {
  if (product.colorVariants && product.colorVariants.length > 0) {
    return product.colorVariants;
  }
  const imgs =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  if (imgs.length === 0) return [];
  return [{ color: SINGLE_COLOR_LABEL, images: imgs }];
}

export function getImagesForColor(
  product: ProductLike,
  color: string,
): string[] {
  const variants = getEffectiveColorVariants(product);
  const found = variants.find((v) => v.color === color);
  return found?.images ?? [];
}
