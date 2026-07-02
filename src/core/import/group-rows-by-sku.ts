import type {
  BulkImportProductGroup,
  BulkImportRow,
  BulkImportRowError,
} from "@/core/schemas/bulk-import.schema";

const BASE_FIELDS = [
  "title",
  "subtitle",
  "description",
  "price",
  "category",
  "shopCategory",
  "isActive",
  "imageUrl_principal",
] as const;

function fieldValue(row: BulkImportRow, field: (typeof BASE_FIELDS)[number]) {
  return row[field];
}

/**
 * Agrupa linhas validadas pelo sku_base (normalizado em minúsculas).
 */
export function groupRowsBySku(
  rows: BulkImportRow[],
): BulkImportProductGroup[] {
  const map = new Map<string, BulkImportProductGroup>();

  for (const row of rows) {
    const key = row.sku_base.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.rows.push(row);
      existing.lineNumbers.push(row.lineNumber);
    } else {
      map.set(key, {
        sku_base: row.sku_base.trim(),
        lineNumbers: [row.lineNumber],
        rows: [row],
      });
    }
  }

  return [...map.values()];
}

/**
 * Valida consistência dos campos base entre linhas do mesmo grupo.
 */
export function validateGroupConsistency(
  group: BulkImportProductGroup,
): BulkImportRowError[] {
  const errors: BulkImportRowError[] = [];
  const [first, ...rest] = group.rows;
  if (!first) return errors;

  for (const row of rest) {
    for (const field of BASE_FIELDS) {
      const a = fieldValue(first, field);
      const b = fieldValue(row, field);
      const same =
        a === b ||
        (a == null && b == null) ||
        (typeof a === "number" && typeof b === "number" && a === b);
      if (!same) {
        errors.push({
          lineNumber: row.lineNumber,
          field,
          message: `Valor de "${field}" diverge da primeira linha do sku_base "${group.sku_base}"`,
        });
      }
    }
  }

  const colors = group.rows.map((r) => r.cor.trim().toLowerCase());
  const seen = new Set<string>();
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    if (seen.has(c)) {
      errors.push({
        lineNumber: group.rows[i].lineNumber,
        field: "cor",
        message: `Cor duplicada "${group.rows[i].cor}" no mesmo sku_base`,
      });
    }
    seen.add(c);
  }

  return errors;
}
