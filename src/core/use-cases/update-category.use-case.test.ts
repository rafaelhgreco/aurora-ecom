import { beforeEach, describe, expect, it } from "vitest";
import type { Category } from "@/core/schemas/category.schema";
import type { Product } from "@/core/schemas/product.schema";
import type { Section } from "@/core/schemas/section.schema";
import { InMemoryCategoryRepository } from "@/infrastructure/repositories/in-memory-category.repository";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { InMemorySectionRepository } from "@/infrastructure/repositories/in-memory-section.repository";
import { UpdateCategoryUseCase } from "./update-category.use-case";

function buildSection(overrides: Partial<Section> = {}): Section {
  return {
    id: "roupas",
    name: "Roupas",
    slug: "roupas",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

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

describe("UpdateCategoryUseCase", () => {
  let categoryRepository: InMemoryCategoryRepository;
  let sectionRepository: InMemorySectionRepository;
  let productRepository: InMemoryProductRepository;
  let useCase: UpdateCategoryUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository([buildCategory()]);
    sectionRepository = new InMemorySectionRepository([buildSection()]);
    productRepository = new InMemoryProductRepository([
      buildProduct({ id: "prod-1" }),
      buildProduct({ id: "prod-2" }),
      buildProduct({ id: "prod-3", category: "Calças" }),
    ]);
    useCase = new UpdateCategoryUseCase(
      categoryRepository,
      sectionRepository,
      productRepository,
    );
  });

  it("renomeia a categoria e sincroniza o nome nos produtos vinculados", async () => {
    const updated = await useCase.execute({ id: "cat-1", name: "Blusas" });

    expect(updated.name).toBe("Blusas");
    expect((await productRepository.findById("prod-1"))?.category).toBe(
      "Blusas",
    );
    expect((await productRepository.findById("prod-2"))?.category).toBe(
      "Blusas",
    );
    // produto de outra subcategoria não deve ser afetado
    expect((await productRepository.findById("prod-3"))?.category).toBe(
      "Calças",
    );
  });

  it("não toca nos produtos quando apenas outros campos mudam (nome inalterado)", async () => {
    await useCase.execute({ id: "cat-1", sectionId: "roupas" });

    expect((await productRepository.findById("prod-1"))?.category).toBe(
      "Camisetas",
    );
  });

  it("não sincroniza produtos quando o nome enviado é igual ao atual", async () => {
    await useCase.execute({ id: "cat-1", name: "Camisetas" });

    expect((await productRepository.findById("prod-1"))?.category).toBe(
      "Camisetas",
    );
  });
});
