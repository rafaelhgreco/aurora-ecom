/**
 * Utilitários para cálculo monetário seguro contra erros de ponto flutuante do
 * JS (ex.: 19.9 * 3 === 59.699999999999996, ou 0.1 + 0.2 !== 0.3).
 */

/** Arredonda um valor monetário para 2 casas decimais. */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Soma valores monetários e arredonda o resultado final para 2 casas decimais. */
export function sumCurrency(values: number[]): number {
  return roundCurrency(values.reduce((sum, value) => sum + value, 0));
}
