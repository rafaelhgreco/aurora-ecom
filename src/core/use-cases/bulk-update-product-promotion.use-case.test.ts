import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import type { Promotion } from "@/core/schemas/promotion.schema";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { InMemoryPromotionRepository } from "@/infrastructure/repositories/in-memory-promotion.repository";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import { BulkUpdateProductPromotionUseCase } from "./bulk-update-product-promotion.use-case";

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
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
  };
}

function buildPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: "promo-1",
    name: "Black Friday",
    discountPercentage: 20,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("BulkUpdateProductPromotionUseCase", () => {
  let productRepository: InMemoryProductRepository;
  let promotionRepository: InMemoryPromotionRepository;
  let useCase: BulkUpdateProductPromotionUseCase;

  beforeEach(() => {
    productRepository = new InMemoryProductRepository([
      buildProduct({ id: "prod-1" }),
      buildProduct({ id: "prod-2" }),
      buildProduct({ id: "prod-3", promotionId: "promo-1" }),
    ]);
    promotionRepository = new InMemoryPromotionRepository([buildPromotion()]);
    useCase = new BulkUpdateProductPromotionUseCase(
      productRepository,
      promotionRepository,
    );
  });

  it("lança ValidationError se nenhum produto for informado", async () => {
    await expect(
      useCase.execute({ productIds: [], promotionId: "promo-1" }),
    ).rejects.toThrow(ValidationError);
  });

  it("lança NotFoundError se a promoção de destino não existe", async () => {
    await expect(
      useCase.execute({ productIds: ["prod-1"], promotionId: "inexistente" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("associa os produtos selecionados à promoção", async () => {
    const result = await useCase.execute({
      productIds: ["prod-1", "prod-2"],
      promotionId: "promo-1",
    });

    expect(result.updatedCount).toBe(2);
    expect((await productRepository.findById("prod-1"))?.promotionId).toBe(
      "promo-1",
    );
  });

  it("remove a promoção enviando null", async () => {
    const result = await useCase.execute({
      productIds: ["prod-3"],
      promotionId: null,
    });

    expect(result.updatedCount).toBe(1);
    expect(
      (await productRepository.findById("prod-3"))?.promotionId,
    ).toBeNull();
  });

  it("zera o override price ao (re)associar em massa", async () => {
    productRepository = new InMemoryProductRepository([
      buildProduct({
        id: "prod-1",
        promotionId: "promo-1",
        promotionOverridePrice: 60,
      }),
    ]);
    useCase = new BulkUpdateProductPromotionUseCase(
      productRepository,
      promotionRepository,
    );

    await useCase.execute({ productIds: ["prod-1"], promotionId: "promo-1" });

    expect(
      (await productRepository.findById("prod-1"))?.promotionOverridePrice,
    ).toBeNull();
  });

  it("deduplica ids repetidos", async () => {
    const result = await useCase.execute({
      productIds: ["prod-1", "prod-1"],
      promotionId: "promo-1",
    });

    expect(result.updatedCount).toBe(1);
  });

  it("reporta ids inexistentes em failedIds sem lançar", async () => {
    const result = await useCase.execute({
      productIds: ["prod-1", "inexistente"],
      promotionId: "promo-1",
    });

    expect(result.updatedCount).toBe(1);
    expect(result.failedIds).toEqual(["inexistente"]);
  });
});
