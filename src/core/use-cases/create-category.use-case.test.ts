import { beforeEach, describe, expect, it } from "vitest";
import type { Section } from "@/core/schemas/section.schema";
import { InMemoryCategoryRepository } from "@/infrastructure/repositories/in-memory-category.repository";
import { InMemorySectionRepository } from "@/infrastructure/repositories/in-memory-section.repository";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import { CreateCategoryUseCase } from "./create-category.use-case";

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

describe("CreateCategoryUseCase", () => {
  let categoryRepository: InMemoryCategoryRepository;
  let sectionRepository: InMemorySectionRepository;
  let useCase: CreateCategoryUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository([]);
    sectionRepository = new InMemorySectionRepository([buildSection()]);
    useCase = new CreateCategoryUseCase(categoryRepository, sectionRepository);
  });

  it("cria uma subcategoria nova vinculada a uma seção existente", async () => {
    const category = await useCase.execute({
      sectionId: "roupas",
      name: "Camisetas",
    });

    expect(category.id).toBeTruthy();
    expect(category.sectionId).toBe("roupas");
    expect(category.name).toBe("Camisetas");
  });

  it("lança NotFoundError se a seção não existe", async () => {
    await expect(
      useCase.execute({ sectionId: "inexistente", name: "Camisetas" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ValidationError para nome duplicado na mesma seção (case-insensitive)", async () => {
    await useCase.execute({ sectionId: "roupas", name: "Camisetas" });

    await expect(
      useCase.execute({ sectionId: "roupas", name: "camisetas" }),
    ).rejects.toThrow(ValidationError);
  });

  it("permite o mesmo nome em seções diferentes", async () => {
    sectionRepository = new InMemorySectionRepository([
      buildSection(),
      buildSection({ id: "cabelos", name: "Cabelos", slug: "cabelos" }),
    ]);
    useCase = new CreateCategoryUseCase(categoryRepository, sectionRepository);

    await useCase.execute({ sectionId: "roupas", name: "Kits" });
    const category = await useCase.execute({
      sectionId: "cabelos",
      name: "Kits",
    });

    expect(category.name).toBe("Kits");
  });

  it("lança ValidationError para nome muito curto", async () => {
    await expect(
      useCase.execute({ sectionId: "roupas", name: "A" }),
    ).rejects.toThrow(ValidationError);
  });
});
