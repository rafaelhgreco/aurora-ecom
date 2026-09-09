/**
 * Converte um `Timestamp` do Firestore Admin SDK (ou qualquer valor com
 * `.toDate()`) para `Date`. Documento sem o campo (ou com formato inesperado)
 * cai em `new Date()` — mesmo fallback usado nos 4 repositórios Firestore
 * antes desta extração.
 */
export function timestampToDate(timestamp: unknown): Date {
  if (
    timestamp &&
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof (timestamp as { toDate: unknown }).toDate === "function"
  ) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  return new Date();
}
