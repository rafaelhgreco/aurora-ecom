import { describe, expect, it } from "vitest";
import { roundCurrency, sumCurrency } from "./money";

describe("roundCurrency", () => {
  it("corrige erro clássico de ponto flutuante em multiplicação (19.9 * 3)", () => {
    expect(19.9 * 3).not.toBe(59.7);
    expect(roundCurrency(19.9 * 3)).toBe(59.7);
  });

  it("corrige erro clássico de ponto flutuante em soma (0.1 + 0.2)", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
  });

  it("arredonda para 2 casas decimais", () => {
    expect(roundCurrency(10.005)).toBe(10.01);
    expect(roundCurrency(10.004)).toBe(10.0);
  });

  it("mantém valores já limpos inalterados", () => {
    expect(roundCurrency(49.9)).toBe(49.9);
    expect(roundCurrency(0)).toBe(0);
  });

  it("arredonda valores negativos (ex.: desconto) de forma consistente", () => {
    expect(roundCurrency(-10.005)).toBe(-10.01);
  });
});

describe("sumCurrency", () => {
  it("soma vários subtotais sem acumular erro de ponto flutuante", () => {
    // 3x um item de 19.90 sem arredondamento intermediário dá 59.699999999999996
    const raw = 19.9 + 19.9 + 19.9;
    expect(raw).not.toBe(59.7);
    expect(sumCurrency([19.9, 19.9, 19.9])).toBe(59.7);
  });

  it("retorna 0 para lista vazia", () => {
    expect(sumCurrency([])).toBe(0);
  });

  it("soma um único valor sem alterá-lo", () => {
    expect(sumCurrency([49.9])).toBe(49.9);
  });
});
