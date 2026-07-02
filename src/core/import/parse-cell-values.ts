/**
 * Utilitários para normalizar valores vindos de células Excel.
 */

export function parseExcelString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

export function parseExcelNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(parseExcelString(value).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function parseExcelIntNonNegative(value: unknown): number {
  const n = parseExcelNumber(value);
  if (n == null) return 0;
  return Math.max(0, Math.trunc(n));
}

/** Aceita sim/sí/yes/true/1 e não/nao/no/false/0 */
export function parseExcelBoolean(value: unknown): boolean | null {
  const s = parseExcelString(value).toLowerCase();
  if (!s) return null;
  if (["sim", "sí", "si", "yes", "y", "true", "1", "ativo"].includes(s)) {
    return true;
  }
  if (["não", "nao", "no", "false", "0", "inativo"].includes(s)) {
    return false;
  }
  return null;
}

/**
 * Formato: `30ml:5|Único:10` — tamanho:quantidade separados por | ou ,
 */
export function parseCustomStockPairs(
  raw: string | undefined,
): { size: string; qty: number }[] {
  if (!raw?.trim()) return [];

  const pairs: { size: string; qty: number }[] = [];
  const segments = raw
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const colon = segment.lastIndexOf(":");
    if (colon <= 0) continue;
    const size = segment.slice(0, colon).trim();
    const qtyRaw = segment.slice(colon + 1).trim();
    if (!size || size.length > 32) continue;
    const qty = parseExcelIntNonNegative(qtyRaw);
    pairs.push({ size, qty });
  }

  return pairs;
}
