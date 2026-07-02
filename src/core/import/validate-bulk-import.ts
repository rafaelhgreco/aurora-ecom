import type {
  BulkImportRow,
  BulkImportRowError,
  BulkImportValidationResult,
} from "@/core/schemas/bulk-import.schema";
import { groupRowsBySku, validateGroupConsistency } from "./group-rows-by-sku";
import {
  type MappedProductResult,
  mapGroupToCreateInput,
} from "./map-group-to-create-input";

export type BulkImportPreviewProduct = {
  sku_base: string;
  title: string;
  colors: string[];
  sizes: string[];
  totalStock: number;
  price: number;
  isActive: boolean;
};

export type BulkImportFullValidation = BulkImportValidationResult & {
  products: BulkImportPreviewProduct[];
  readyInputs: MappedProductResult[];
};

export function validateBulkImportRows(
  rows: BulkImportRow[],
): BulkImportFullValidation {
  const groups = groupRowsBySku(rows);
  const rowErrors: BulkImportRowError[] = [];
  const groupErrors: Array<{ sku_base: string; message: string }> = [];
  const products: BulkImportPreviewProduct[] = [];
  const readyInputs: MappedProductResult[] = [];

  for (const group of groups) {
    const consistencyErrors = validateGroupConsistency(group);
    rowErrors.push(...consistencyErrors);

    if (consistencyErrors.length > 0) continue;

    const mapped = mapGroupToCreateInput(group);
    readyInputs.push(mapped);

    if (!mapped.ok) {
      groupErrors.push({ sku_base: group.sku_base, message: mapped.message });
      continue;
    }

    const input = mapped.input;
    products.push({
      sku_base: group.sku_base,
      title: input.title,
      colors: input.colorVariants?.map((v) => v.color) ?? [],
      sizes: input.sizes ?? [],
      totalStock: input.stock ?? 0,
      price: input.price,
      isActive: input.isActive ?? true,
    });
  }

  return {
    groups,
    rowErrors,
    groupErrors,
    products,
    readyInputs,
  };
}
