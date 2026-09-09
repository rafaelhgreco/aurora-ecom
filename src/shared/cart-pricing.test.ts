import { describe, expect, it } from "vitest";
import { ProductEntity } from "@/core/entities";
import type { Product } from "@/core/schemas/product.schema";
import {
  aggregateQuantitiesByVariant,
  type CartLineInput,
  cartLineVariantKey,
  priceCartLine,
  sumCartLines,
  validateCartLinesShape,
} from "./cart-pricing";

function makeProduct(overrides: Partial<Product> = {}): ProductEntity {
  return new ProductEntity({
    id: "prod-1",
    title: "Camiseta Básica",
    description: "Descrição",
    price: 49.9,
    imageUrl: "https://example.com/img.jpg",
    images: ["https://example.com/img.jpg"],
    stock: 10,
    status: "ACTIVE",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe("validateCartLinesShape", () => {
  it("rejeita carrinho vazio", () => {
    expect(validateCartLinesShape([]).valid).toBe(false);
  });

  it("rejeita productId ausente ou não-string", () => {
    // Payload malformado vindo de um client não confiável (productId numérico
    // em vez de string) — `unknown` expressa isso melhor que `any`.
    const bad: unknown = [{ productId: 123, quantity: 1 }];
    expect(validateCartLinesShape(bad as CartLineInput[]).valid).toBe(false);
  });

  it("rejeita quantidade zero ou negativa", () => {
    expect(
      validateCartLinesShape([{ productId: "p1", quantity: 0 }]).valid,
    ).toBe(false);
    expect(
      validateCartLinesShape([{ productId: "p1", quantity: -1 }]).valid,
    ).toBe(false);
  });

  it("rejeita quantidade acima do limite de 100", () => {
    expect(
      validateCartLinesShape([{ productId: "p1", quantity: 101 }]).valid,
    ).toBe(false);
  });

  it("rejeita quantidade fracionária (não é uma contagem de unidades válida)", () => {
    const result = validateCartLinesShape([{ productId: "p1", quantity: 2.5 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/inteiro/);
  });

  it("aceita quantidade inteira dentro do intervalo permitido", () => {
    expect(
      validateCartLinesShape([{ productId: "p1", quantity: 5 }]).valid,
    ).toBe(true);
    expect(
      validateCartLinesShape([{ productId: "p1", quantity: 100 }]).valid,
    ).toBe(true);
  });
});

describe("cartLineVariantKey", () => {
  it("gera a mesma chave para linhas com o mesmo produto+variante", () => {
    const a = cartLineVariantKey({
      productId: "p1",
      quantity: 3,
      variants: { size: "M", color: "Preto" },
    });
    const b = cartLineVariantKey({
      productId: "p1",
      quantity: 7,
      variants: { size: "M", color: "Preto" },
    });
    expect(a).toBe(b);
  });

  it("gera chaves diferentes para tamanhos ou cores diferentes", () => {
    const base = { productId: "p1", quantity: 1 };
    const m = cartLineVariantKey({ ...base, variants: { size: "M" } });
    const g = cartLineVariantKey({ ...base, variants: { size: "G" } });
    expect(m).not.toBe(g);
  });
});

describe("aggregateQuantitiesByVariant", () => {
  it("soma quantidades de linhas duplicadas (mesmo produto+variante)", () => {
    const totals = aggregateQuantitiesByVariant([
      { productId: "p1", quantity: 40, variants: { size: "M" } },
      { productId: "p1", quantity: 40, variants: { size: "M" } },
    ]);
    expect(
      totals.get(
        cartLineVariantKey({
          productId: "p1",
          quantity: 0,
          variants: { size: "M" },
        }),
      ),
    ).toBe(80);
  });

  it("mantém totais separados para produtos/variantes diferentes", () => {
    const totals = aggregateQuantitiesByVariant([
      { productId: "p1", quantity: 2, variants: { size: "M" } },
      { productId: "p1", quantity: 3, variants: { size: "G" } },
      { productId: "p2", quantity: 5 },
    ]);
    expect(totals.size).toBe(3);
  });
});

describe("priceCartLine", () => {
  it("calcula o subtotal a partir do preço do produto no servidor, não do client", () => {
    const product = makeProduct({ price: 19.9 });
    const line = priceCartLine(
      { productId: "prod-1", quantity: 3 },
      product,
      3,
    );
    // 19.9 * 3 dá 59.699999999999996 em ponto flutuante puro
    expect(line.subtotal).toBe(59.7);
  });

  it("lança erro quando o produto está inativo", () => {
    const product = makeProduct({ isActive: false });
    expect(() =>
      priceCartLine({ productId: "prod-1", quantity: 1 }, product, 1),
    ).toThrow(/não está disponível/);
  });

  it("lança erro quando a quantidade da linha excede o estoque simples", () => {
    const product = makeProduct({ stock: 5 });
    expect(() =>
      priceCartLine({ productId: "prod-1", quantity: 6 }, product, 6),
    ).toThrow(/Estoque insuficiente/);
  });

  it("valida estoque por tamanho quando o produto tem variantes de tamanho", () => {
    const product = makeProduct({
      sizes: ["P", "M"],
      stockBySize: { P: 2, M: 5 },
    });

    expect(() =>
      priceCartLine(
        { productId: "prod-1", quantity: 3, variants: { size: "P" } },
        product,
        3,
      ),
    ).toThrow(/Estoque insuficiente/);

    const ok = priceCartLine(
      { productId: "prod-1", quantity: 2, variants: { size: "P" } },
      product,
      2,
    );
    expect(ok.subtotal).toBe(roundedPrice(product.price, 2));
  });

  it("bloqueia overselling quando a mesma combinação produto+variante aparece em linhas separadas", () => {
    // Produto com 100 unidades em estoque total.
    const product = makeProduct({ stock: 100 });

    // Cada linha isolada (90 unidades) fica dentro do estoque disponível (100),
    // mas a demanda agregada das duas linhas (180) excede o estoque real.
    // priceCartLine recebe o total agregado (como o checkout de verdade faz via
    // aggregateQuantitiesByVariant) e deve rejeitar mesmo a linha individual
    // "cabendo" sozinha.
    expect(() =>
      priceCartLine({ productId: "prod-1", quantity: 90 }, product, 180),
    ).toThrow(/Estoque insuficiente/);
  });
});

describe("sumCartLines", () => {
  it("soma os subtotais de todas as linhas sem erro de ponto flutuante", () => {
    const total = sumCartLines([
      { subtotal: 19.9 },
      { subtotal: 19.9 },
      { subtotal: 19.9 },
    ]);
    expect(total).toBe(59.7);
  });

  it("retorna 0 para carrinho vazio", () => {
    expect(sumCartLines([])).toBe(0);
  });
});

function roundedPrice(price: number, quantity: number): number {
  return Math.round((price * quantity + Number.EPSILON) * 100) / 100;
}
