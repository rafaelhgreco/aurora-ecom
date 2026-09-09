import type { BulkImportProductGroup } from "@/core/schemas/bulk-import.schema";
import {
  type CreateProductInput,
  createProductSchema,
  type ProductColorVariant,
  type ProductSize,
} from "@/core/schemas/product.schema";
import { normalizeCreateProductInput } from "@/core/schemas/product-normalize";
import { buildVariantStockBySize } from "@/shared/admin-product-stock";

export type MappedProductResult =
  | { ok: true; input: CreateProductInput; sku_base: string }
  | { ok: false; sku_base: string; message: string };

function collectSizesFromGroup(group: BulkImportProductGroup): ProductSize[] {
  const set = new Set<ProductSize>();
  for (const row of group.rows) {
    for (const size of Object.keys(row.stockBySize)) {
      set.add(size);
    }
  }
  return [...set];
}

export function mapGroupToCreateInput(
  group: BulkImportProductGroup,
): MappedProductResult {
  const first = group.rows[0];
  if (!first) {
    return { ok: false, sku_base: group.sku_base, message: "Grupo vazio" };
  }

  const sizes = collectSizesFromGroup(group);
  if (sizes.length === 0) {
    return {
      ok: false,
      sku_base: group.sku_base,
      message:
        "Informe estoque em pelo menos um tamanho (colunas stock_* ou estoque_custom)",
    };
  }

  const colorVariants: ProductColorVariant[] = group.rows.map((row) => ({
    color: row.cor,
    images: row.imagens_cor,
    stockBySize: buildVariantStockBySize(row.stockBySize, sizes),
  }));

  const raw: CreateProductInput = {
    title: first.title,
    subtitle: first.subtitle,
    description: first.description,
    price: first.price,
    category: first.category,
    shopCategory: first.shopCategory ?? "roupas",
    sizes,
    colorVariants,
    isActive: first.isActive,
    status: "ACTIVE",
    imageUrl: first.imageUrl_principal ?? colorVariants[0].images[0],
    images: [...new Set(colorVariants.flatMap((v) => v.images))],
    stock: 0,
  };

  const normalized = normalizeCreateProductInput(raw);

  if (normalized.images && normalized.images.length > 10) {
    return {
      ok: false,
      sku_base: group.sku_base,
      message: `Produto excede 10 imagens no total (${normalized.images.length})`,
    };
  }

  const parsed = createProductSchema.safeParse(normalized);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return { ok: false, sku_base: group.sku_base, message: msg };
  }

  return { ok: true, input: parsed.data, sku_base: group.sku_base };
}
