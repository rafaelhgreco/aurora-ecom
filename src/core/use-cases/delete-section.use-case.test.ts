import { beforeEach, describe, expect, it } from "vitest";
import type { Category } from "@/core/schemas/category.schema";
import type { Product } from "@/core/schemas/product.schema";
import type { Section } from "@/core/schemas/section.schema";
import { InMemoryCategoryRepository } from "@/infrastructure/repositories/in-memory-category.repository";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { InMemorySectionRepository } from "@/infrastructure/repositories/in-memory-section.repository";
import { DomainError, NotFoundError } from "@/shared/errors/domain-errors";
import { DeleteSectionUseCase } from "./delete-section.use-case";

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
    shopCategory: "roupas",
    ...overrides,
  };
}

describe("DeleteSectionUseCase", () => {
  let sectionRepository: InMemorySectionRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let productRepository: InMemoryProductRepository;
  let useCase: DeleteSectionUseCase;

  beforeEach(() => {
    sectionRepository = new InMemorySectionRepository([buildSection()]);
    categoryRepository = new InMemoryCategoryRepository([]);
    productRepository = new InMemoryProductRepository([]);
    useCase = new DeleteSectionUseCase(
      sectionRepository,
      categoryRepository,
      productRepository,
    );
  });

  it("lança NotFoundError se seção não existe", async () => {
    await expect(useCase.execute("inexistente")).rejects.toThrow(NotFoundError);
  });

  it("exclui seção sem subcategorias ou produtos vinculados", async () => {
    await useCase.execute("roupas");

    expect(await sectionRepository.exists("roupas")).toBe(false);
  });

  it("bloqueia exclusão quando há subcategorias vinculadas", async () => {
    categoryRepository = new InMemoryCategoryRepository([buildCategory()]);
    useCase = new DeleteSectionUseCase(
      sectionRepository,
      categoryRepository,
      productRepository,
    );

    await expect(useCase.execute("roupas")).rejects.toThrow(DomainError);
    expect(await sectionRepository.exists("roupas")).toBe(true);
  });

  it("bloqueia exclusão quando há produtos vinculados diretamente à seção", async () => {
    productRepository = new InMemoryProductRepository([buildProduct()]);
    useCase = new DeleteSectionUseCase(
      sectionRepository,
      categoryRepository,
      productRepository,
    );

    await expect(useCase.execute("roupas")).rejects.toThrow(DomainError);
    expect(await sectionRepository.exists("roupas")).toBe(true);
  });
});
