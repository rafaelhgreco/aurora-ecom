import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { ValidationError } from "@/shared/errors/domain-errors";
import { BulkUpdateProductCategoryUseCase } from "./bulk-update-product-category.use-case";

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
    category: "Camisetas",
    ...overrides,
  };
}

describe("BulkUpdateProductCategoryUseCase", () => {
  let productRepository: InMemoryProductRepository;
  let useCase: BulkUpdateProductCategoryUseCase;

  beforeEach(() => {
    productRepository = new InMemoryProductRepository([
      buildProduct({ id: "prod-1" }),
      buildProduct({ id: "prod-2" }),
      buildProduct({ id: "prod-3", category: "Calças" }),
    ]);
    useCase = new BulkUpdateProductCategoryUseCase(productRepository);
  });

  it("lança ValidationError se nenhum produto for informado", async () => {
    await expect(
      useCase.execute({ productIds: [], category: "Calças" }),
    ).rejects.toThrow(ValidationError);
  });

  it("move os produtos selecionados para outra subcategoria", async () => {
    const result = await useCase.execute({
      productIds: ["prod-1", "prod-2"],
      category: "Calças",
    });

    expect(result.updatedCount).toBe(2);
    expect(result.failedIds).toEqual([]);
    expect((await productRepository.findById("prod-1"))?.category).toBe(
      "Calças",
    );
    expect((await productRepository.findById("prod-2"))?.category).toBe(
      "Calças",
    );
  });

  it("limpa a subcategoria (Nenhuma) enviando string vazia", async () => {
    const result = await useCase.execute({
      productIds: ["prod-1"],
      category: "",
    });

    expect(result.updatedCount).toBe(1);
    expect((await productRepository.findById("prod-1"))?.category).toBe("");
  });

  it("deduplica ids repetidos", async () => {
    const result = await useCase.execute({
      productIds: ["prod-1", "prod-1"],
      category: "Calças",
    });

    expect(result.updatedCount).toBe(1);
  });

  it("reporta ids inexistentes em failedIds sem lançar", async () => {
    const result = await useCase.execute({
      productIds: ["prod-1", "inexistente"],
      category: "Calças",
    });

    expect(result.updatedCount).toBe(1);
    expect(result.failedIds).toEqual(["inexistente"]);
  });
});
