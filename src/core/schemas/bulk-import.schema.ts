import { z } from "zod";
import { SHOP_CATEGORY_IDS } from "@/core/catalog/shop-catalog";
import {
  PRODUCT_SIZES_CLOTHING,
  PRODUCT_SIZES_VOLUME,
} from "@/core/schemas/product.schema";

/** Colunas fixas da aba Produtos do template */
export const BULK_IMPORT_COLUMNS = [
  "sku_base",
  "title",
  "subtitle",
  "description",
  "price",
  "category",
  "shopCategory",
  "cor",
  "imagens_cor",
  ...PRODUCT_SIZES_CLOTHING.map((s) => `stock_${s}` as const),
  ...PRODUCT_SIZES_VOLUME.map((s) => `stock_${s}` as const),
  "estoque_custom",
  "isActive",
  "imageUrl_principal",
] as const;

export type BulkImportColumn = (typeof BULK_IMPORT_COLUMNS)[number];

export const bulkImportRowSchema = z.object({
  lineNumber: z.number().int().positive(),
  sku_base: z.string().min(1, "sku_base é obrigatório").max(64).trim(),
  title: z.string().min(3).max(100).trim(),
  subtitle: z.string().max(200).trim().optional(),
  description: z.string().min(10).max(5000).trim(),
  price: z
    .number()
    .positive("Preço deve ser maior que zero")
    .finite()
    .multipleOf(0.01),
  category: z.string().min(2).max(50).trim().optional(),
  shopCategory: z.enum(SHOP_CATEGORY_IDS).optional(),
  cor: z.string().min(1, "cor é obrigatória").max(40).trim(),
  imagens_cor: z
    .array(z.string().url())
    .min(1, "Cada cor precisa de pelo menos uma imagem válida")
    .max(10),
  stockBySize: z.record(
    z.string().min(1).max(32),
    z.number().int().nonnegative(),
  ),
  isActive: z.boolean(),
  imageUrl_principal: z.string().url().optional(),
});

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

export type BulkImportRowError = {
  lineNumber: number;
  field?: string;
  message: string;
};

export type BulkImportProductGroup = {
  sku_base: string;
  lineNumbers: number[];
  rows: BulkImportRow[];
};

export type BulkImportValidationResult = {
  groups: BulkImportProductGroup[];
  rowErrors: BulkImportRowError[];
  groupErrors: Array<{ sku_base: string; message: string }>;
};
