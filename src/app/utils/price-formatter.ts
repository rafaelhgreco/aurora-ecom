/**
 * Formata valor numérico para moeda brasileira
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

/**
 * Calcula e formata valor de parcela
 */
export const calculateInstallment = (
  price: number,
  installments: number,
): string => {
  const installmentValue = price / installments;
  return formatPrice(installmentValue);
};

/**
 * Formata data para formato brasileiro
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

/**
 * Formata data e hora para formato brasileiro
 */
export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
