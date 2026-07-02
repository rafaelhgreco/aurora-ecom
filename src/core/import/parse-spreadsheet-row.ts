import type {
  BulkImportRow,
  BulkImportRowError,
} from "@/core/schemas/bulk-import.schema";
import {
  BULK_IMPORT_COLUMNS,
  type BulkImportColumn,
  bulkImportRowSchema,
} from "@/core/schemas/bulk-import.schema";

const COLUMN_KEY_LOOKUP = new Map<string, BulkImportColumn>(
  BULK_IMPORT_COLUMNS.map((col) => [col.toLowerCase(), col]),
);

import {
  PRODUCT_SIZES_CLOTHING,
  PRODUCT_SIZES_VOLUME,
} from "@/core/schemas/product.schema";
import { parseImageRefs } from "./normalize-cloudinary-ref";
import {
  parseCustomStockPairs,
  parseExcelBoolean,
  parseExcelIntNonNegative,
  parseExcelNumber,
  parseExcelString,
} from "./parse-cell-values";

export type RawSpreadsheetRow = Record<string, unknown> & {
  lineNumber: number;
};

function buildStockBySize(raw: RawSpreadsheetRow): Record<string, number> {
  const stock: Record<string, number> = {};

  for (const size of PRODUCT_SIZES_CLOTHING) {
    const key = `stock_${size}`;
    const qty = parseExcelIntNonNegative(raw[key]);
    if (qty > 0) stock[size] = qty;
  }

  for (const size of PRODUCT_SIZES_VOLUME) {
    const key = `stock_${size}`;
    const qty = parseExcelIntNonNegative(raw[key]);
    if (qty > 0) stock[size] = qty;
  }

  const customRaw = parseExcelString(raw.estoque_custom);
  for (const { size, qty } of parseCustomStockPairs(customRaw)) {
    if (qty > 0) stock[size] = qty;
  }

  return stock;
}

/**
 * Converte uma linha bruta da planilha em BulkImportRow ou lista de erros.
 */
export function parseSpreadsheetRow(
  raw: RawSpreadsheetRow,
  cloudName?: string,
): { row?: BulkImportRow; errors: BulkImportRowError[] } {
  const errors: BulkImportRowError[] = [];
  const lineNumber = raw.lineNumber;

  const imagensRaw = parseExcelString(raw.imagens_cor);
  const { urls, invalid } = parseImageRefs(imagensRaw, cloudName);
  if (invalid.length > 0) {
    for (const ref of invalid) {
      errors.push({
        lineNumber,
        field: "imagens_cor",
        message: `Referência de imagem inválida: "${ref}"`,
      });
    }
  }

  const isActiveParsed = parseExcelBoolean(raw.isActive);
  if (isActiveParsed === null) {
    errors.push({
      lineNumber,
      field: "isActive",
      message: 'isActive deve ser "sim" ou "não"',
    });
  }

  const price = parseExcelNumber(raw.price);
  if (price == null) {
    errors.push({
      lineNumber,
      field: "price",
      message: "price deve ser um número válido",
    });
  }

  const principalRaw = parseExcelString(raw.imageUrl_principal);
  let imageUrlPrincipal: string | undefined;
  if (principalRaw) {
    const { urls: principalUrls, invalid: principalInvalid } = parseImageRefs(
      principalRaw,
      cloudName,
    );
    if (principalInvalid.length > 0) {
      errors.push({
        lineNumber,
        field: "imageUrl_principal",
        message: `Imagem principal inválida: "${principalInvalid[0]}"`,
      });
    } else if (principalUrls[0]) {
      imageUrlPrincipal = principalUrls[0];
    }
  }

  const shopCategoryRaw = parseExcelString(raw.shopCategory);
  const candidate = {
    lineNumber,
    sku_base: parseExcelString(raw.sku_base),
    title: parseExcelString(raw.title),
    subtitle: parseExcelString(raw.subtitle) || undefined,
    description: parseExcelString(raw.description),
    price: price ?? 0,
    category: parseExcelString(raw.category) || undefined,
    shopCategory: shopCategoryRaw || undefined,
    cor: parseExcelString(raw.cor),
    imagens_cor: urls,
    stockBySize: buildStockBySize(raw),
    isActive: isActiveParsed ?? true,
    imageUrl_principal: imageUrlPrincipal,
  };

  const parsed = bulkImportRowSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({
        lineNumber,
        field: issue.path.join("."),
        message: issue.message,
      });
    }
    return { errors };
  }

  if (errors.length > 0) return { errors };

  return { row: parsed.data, errors: [] };
}

/**
 * Normaliza cabeçalho da planilha para a chave canônica (ex.: isactive → isActive).
 */
export function canonicalizeColumnKey(key: string): BulkImportColumn | string {
  const normalized = key.trim().toLowerCase().replace(/\s+/g, "_");
  if (!normalized) return "";
  return COLUMN_KEY_LOOKUP.get(normalized) ?? normalized;
}

/** @deprecated use canonicalizeColumnKey */
export function normalizeHeaderKey(key: string): string {
  const c = canonicalizeColumnKey(key);
  return typeof c === "string" ? c : c;
}

export function isHeaderRow(values: unknown[]): boolean {
  const first = parseExcelString(values[0]).toLowerCase();
  return first === "sku_base" || first === "sku";
}

export function mapRowValuesToRecord(
  headers: string[],
  values: unknown[],
  lineNumber: number,
): RawSpreadsheetRow {
  const record: RawSpreadsheetRow = { lineNumber };
  for (let i = 0; i < headers.length; i++) {
    const key = canonicalizeColumnKey(headers[i] ?? "");
    if (!key) continue;
    record[key] = values[i];
  }
  return record;
}

export function isRowEmpty(record: RawSpreadsheetRow): boolean {
  return BULK_IMPORT_COLUMNS.every((col) => {
    const v = record[col];
    return v == null || parseExcelString(v) === "";
  });
}
