import { beforeEach, describe, expect, it } from "vitest";
import type { Category } from "@/core/schemas/category.schema";
import type { Product } from "@/core/schemas/product.schema";
import { InMemoryCategoryRepository } from "@/infrastructure/repositories/in-memory-category.repository";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { DomainError, NotFoundError } from "@/shared/errors/domain-errors";
import { DeleteCategoryUseCase } from "./delete-category.use-case";

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-1",
    sectionId: "roupas",
    name: "Camisetas",
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
    category: "Camisetas",
    ...overrides,
  };
}

describe("DeleteCategoryUseCase", () => {
  let categoryRepository: InMemoryCategoryRepository;
  let productRepository: InMemoryProductRepository;
  let useCase: DeleteCategoryUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository([buildCategory()]);
    productRepository = new InMemoryProductRepository([]);
    useCase = new DeleteCategoryUseCase(categoryRepository, productRepository);
  });

  it("lança NotFoundError se categoria não existe", async () => {
    await expect(useCase.execute("inexistente")).rejects.toThrow(NotFoundError);
  });

  it("exclui categoria sem produtos vinculados", async () => {
    await useCase.execute("cat-1");

    expect(await categoryRepository.exists("cat-1")).toBe(false);
  });

  it("bloqueia exclusão quando há produtos vinculados", async () => {
    productRepository = new InMemoryProductRepository([buildProduct()]);
    useCase = new DeleteCategoryUseCase(categoryRepository, productRepository);

    await expect(useCase.execute("cat-1")).rejects.toThrow(DomainError);
    expect(await categoryRepository.exists("cat-1")).toBe(true);
  });
});
