import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import type { Promotion } from "@/core/schemas/promotion.schema";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { InMemoryPromotionRepository } from "@/infrastructure/repositories/in-memory-promotion.repository";
import { DomainError, NotFoundError } from "@/shared/errors/domain-errors";
import { DeletePromotionUseCase } from "./delete-promotion.use-case";

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

describe("DeletePromotionUseCase", () => {
  let promotionRepository: InMemoryPromotionRepository;
  let productRepository: InMemoryProductRepository;
  let useCase: DeletePromotionUseCase;

  beforeEach(() => {
    promotionRepository = new InMemoryPromotionRepository([buildPromotion()]);
    productRepository = new InMemoryProductRepository([]);
    useCase = new DeletePromotionUseCase(
      promotionRepository,
      productRepository,
    );
  });

  it("lança NotFoundError se a promoção não existe", async () => {
    await expect(useCase.execute("inexistente")).rejects.toThrow(NotFoundError);
  });

  it("exclui promoção sem produtos vinculados", async () => {
    await useCase.execute("promo-1");

    expect(await promotionRepository.exists("promo-1")).toBe(false);
  });

  it("bloqueia exclusão quando há produtos vinculados", async () => {
    productRepository = new InMemoryProductRepository([
      buildProduct({ promotionId: "promo-1" }),
    ]);
    useCase = new DeletePromotionUseCase(
      promotionRepository,
      productRepository,
    );

    await expect(useCase.execute("promo-1")).rejects.toThrow(DomainError);
    expect(await promotionRepository.exists("promo-1")).toBe(true);
  });
});
