import { beforeEach, describe, expect, it } from "vitest";
import { InMemorySectionRepository } from "@/infrastructure/repositories/in-memory-section.repository";
import { ValidationError } from "@/shared/errors/domain-errors";
import { CreateSectionUseCase } from "./create-section.use-case";

describe("CreateSectionUseCase", () => {
  let repository: InMemorySectionRepository;
  let useCase: CreateSectionUseCase;

  beforeEach(() => {
    repository = new InMemorySectionRepository([]);
    useCase = new CreateSectionUseCase(repository);
  });

  it("cria uma seção nova", async () => {
    const section = await useCase.execute({
      name: "Roupas",
      slug: "roupas",
    });

    expect(section.id).toBeTruthy();
    expect(section.name).toBe("Roupas");
    expect(section.slug).toBe("roupas");
  });

  it("lança ValidationError para nome duplicado (case-insensitive)", async () => {
    await useCase.execute({ name: "Roupas", slug: "roupas" });

    await expect(
      useCase.execute({ name: "roupas", slug: "roupas-2" }),
    ).rejects.toThrow(ValidationError);
  });

  it("lança ValidationError para slug duplicado", async () => {
    await useCase.execute({ name: "Roupas", slug: "roupas" });

    await expect(
      useCase.execute({ name: "Outra Seção", slug: "roupas" }),
    ).rejects.toThrow(ValidationError);
  });

  it("lança ValidationError para slug em formato inválido", async () => {
    await expect(
      useCase.execute({ name: "Roupas", slug: "Roupas Novas!" }),
    ).rejects.toThrow(ValidationError);
  });
});
