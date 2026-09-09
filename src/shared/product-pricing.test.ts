import { describe, expect, it } from "vitest";
import {
  computeEffectivePrice,
  decorateProductsWithPricing,
  type PromotableProduct,
  type PromotionForPricing,
} from "./product-pricing";

const product: PromotableProduct = {
  price: 100,
  promotionId: "promo-1",
  promotionOverridePrice: null,
};

const promotion: PromotionForPricing = {
  id: "promo-1",
  discountPercentage: 20,
  active: true,
};

describe("computeEffectivePrice", () => {
  it("sem desconto quando a flag está desligada", () => {
    const result = computeEffectivePrice(product, promotion, false);
    expect(result).toEqual({
      price: 100,
      originalPrice: null,
      hasDiscount: false,
    });
  });

  it("sem desconto quando o produto não tem promoção associada", () => {
    const result = computeEffectivePrice(
      { price: 100, promotionId: null },
      promotion,
      true,
    );
    expect(result.hasDiscount).toBe(false);
    expect(result.price).toBe(100);
  });

  it("sem desconto quando a promoção é null", () => {
    const result = computeEffectivePrice(product, null, true);
    expect(result.hasDiscount).toBe(false);
  });

  it("sem desconto quando a promoção está inativa", () => {
    const result = computeEffectivePrice(
      product,
      { ...promotion, active: false },
      true,
    );
    expect(result.hasDiscount).toBe(false);
  });

  it("sem desconto quando o id da promoção não bate com o do produto", () => {
    const result = computeEffectivePrice(
      product,
      { ...promotion, id: "outra-promo" },
      true,
    );
    expect(result.hasDiscount).toBe(false);
  });

  it("sem desconto quando discountPercentage é 0", () => {
    const result = computeEffectivePrice(
      product,
      { ...promotion, discountPercentage: 0 },
      true,
    );
    expect(result.hasDiscount).toBe(false);
  });

  it("aplica percentual sobre o preço de tabela quando não há override", () => {
    const result = computeEffectivePrice(product, promotion, true);
    expect(result).toEqual({
      price: 80,
      originalPrice: 100,
      hasDiscount: true,
    });
  });

  it("aplica percentual sobre o valor base (override) quando definido", () => {
    const withOverride: PromotableProduct = {
      ...product,
      promotionOverridePrice: 60,
    };
    const result = computeEffectivePrice(withOverride, promotion, true);
    expect(result).toEqual({ price: 48, originalPrice: 60, hasDiscount: true });
  });

  it("arredonda o preço com desconto para 2 casas decimais", () => {
    const result = computeEffectivePrice(
      { price: 19.99, promotionId: "promo-1" },
      { id: "promo-1", discountPercentage: 33, active: true },
      true,
    );
    expect(result.price).toBe(13.39);
  });
});

describe("decorateProductsWithPricing", () => {
  const repo = {
    findAll: async () => [promotion],
  };

  it("não lê promoções quando a flag está desligada", async () => {
    let called = false;
    const spyRepo = {
      findAll: async () => {
        called = true;
        return [promotion];
      },
    };
    const [decorated] = await decorateProductsWithPricing(
      [product],
      spyRepo,
      false,
    );
    expect(called).toBe(false);
    expect(decorated.effectivePrice).toBe(100);
    expect(decorated.originalPrice).toBeNull();
  });

  it("não lê promoções quando nenhum produto tem promotionId", async () => {
    let called = false;
    const spyRepo = {
      findAll: async () => {
        called = true;
        return [promotion];
      },
    };
    await decorateProductsWithPricing(
      [{ price: 50, promotionId: null }],
      spyRepo,
      true,
    );
    expect(called).toBe(false);
  });

  it("decora produtos com effectivePrice/originalPrice", async () => {
    const [decorated] = await decorateProductsWithPricing(
      [product],
      repo,
      true,
    );
    expect(decorated.effectivePrice).toBe(80);
    expect(decorated.originalPrice).toBe(100);
  });

  it("faz uma única leitura de promoções para múltiplos produtos", async () => {
    let calls = 0;
    const spyRepo = {
      findAll: async () => {
        calls += 1;
        return [promotion];
      },
    };
    await decorateProductsWithPricing(
      [product, { ...product, price: 200 }, { price: 30, promotionId: null }],
      spyRepo,
      true,
    );
    expect(calls).toBe(1);
  });
});
