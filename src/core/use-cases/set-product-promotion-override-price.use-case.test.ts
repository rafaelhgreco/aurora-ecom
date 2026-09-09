import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import { SetProductPromotionOverridePriceUseCase } from "./set-product-promotion-override-price.use-case";

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    title: "Camiseta Básica",
    description: "Descrição",
    price: 100,
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

describe("SetProductPromotionOverridePriceUseCase", () => {
  let productRepository: InMemoryProductRepository;
  let useCase: SetProductPromotionOverridePriceUseCase;

  beforeEach(() => {
    productRepository = new InMemoryProductRepository([
      buildProduct({ id: "prod-1", promotionId: "promo-1" }),
      buildProduct({ id: "prod-2", promotionId: null }),
    ]);
    useCase = new SetProductPromotionOverridePriceUseCase(productRepository);
  });

  it("lança NotFoundError se o produto não existe", async () => {
    await expect(
      useCase.execute({ productId: "inexistente", overridePrice: 60 }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ValidationError se o produto não tem promoção associada", async () => {
    await expect(
      useCase.execute({ productId: "prod-2", overridePrice: 60 }),
    ).rejects.toThrow(ValidationError);
  });

  it("define o valor base do produto", async () => {
    const updated = await useCase.execute({
      productId: "prod-1",
      overridePrice: 60,
    });

    expect(updated.promotionOverridePrice).toBe(60);
  });

  it("limpa o valor base enviando null", async () => {
    await useCase.execute({ productId: "prod-1", overridePrice: 60 });
    const updated = await useCase.execute({
      productId: "prod-1",
      overridePrice: null,
    });

    expect(updated.promotionOverridePrice).toBeNull();
  });

  it("lança ValidationError para valor não positivo", async () => {
    await expect(
      useCase.execute({ productId: "prod-1", overridePrice: -10 }),
    ).rejects.toThrow(ValidationError);
    await expect(
      useCase.execute({ productId: "prod-1", overridePrice: 0 }),
    ).rejects.toThrow(ValidationError);
  });
});
