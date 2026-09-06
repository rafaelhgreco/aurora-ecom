import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import { PublishProductUseCase } from "./publish-product.use-case";

describe("PublishProductUseCase", () => {
  let repository: InMemoryProductRepository;
  let useCase: PublishProductUseCase;

  beforeEach(() => {
    repository = new InMemoryProductRepository([]);
    useCase = new PublishProductUseCase(repository);
  });

  describe("Cenário: Aprovar e publicar um produto DRAFT", () => {
    it("atualiza título/preço/categoria e muda status para ACTIVE", async () => {
      const draft: Product = {
        id: "789102030",
        barcode: "789102030",
        title: "Título Provisório",
        description: "Descrição",
        price: 0,
        imageUrl: "/placeholder.png",
        images: ["/placeholder.png"],
        stock: 5,
        status: "DRAFT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: "camisetas",
      };

      const repo = new InMemoryProductRepository([draft]);
      const uc = new PublishProductUseCase(repo);

      const published = await uc.execute({
        id: "789102030",
        title: "Camiseta Verão Premium",
        price: 89.9,
        category: "Camisetas",
      });

      expect(published.status).toBe("ACTIVE");
      expect(published.title).toBe("Camiseta Verão Premium");
      expect(published.price).toBe(89.9);
      expect(published.category).toBe("Camisetas");
    });
  });

  describe("Erros de validação", () => {
    it("lança NotFoundError se produto não existe", async () => {
      const repo = new InMemoryProductRepository([]);
      const uc = new PublishProductUseCase(repo);

      await expect(
        uc.execute({
          id: "inexistente",
          title: "Nome",
          price: 49.9,
          category: "camisetas",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("lança ValidationError se produto já está ACTIVE", async () => {
      const active: Product = {
        id: "123456789",
        title: "Produto Ativo",
        description: "Descrição",
        price: 49.9,
        imageUrl: "https://example.com/img.jpg",
        images: ["https://example.com/img.jpg"],
        stock: 10,
        status: "ACTIVE",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = new InMemoryProductRepository([active]);
      const uc = new PublishProductUseCase(repo);

      await expect(
        uc.execute({
          id: "123456789",
          title: "Novo Nome",
          price: 59.9,
          category: "camisetas",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("lança ValidationError para título com menos de 3 caracteres", async () => {
      const draft: Product = {
        id: "draft1",
        title: "Draft",
        description: "Descrição",
        price: 0,
        imageUrl: "/placeholder.png",
        images: ["/placeholder.png"],
        stock: 1,
        status: "DRAFT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = new InMemoryProductRepository([draft]);
      const uc = new PublishProductUseCase(repo);

      await expect(
        uc.execute({
          id: "draft1",
          title: "AB",
          price: 49.9,
          category: "camisetas",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("lança ValidationError para preço negativo", async () => {
      const draft: Product = {
        id: "draft2",
        title: "Draft",
        description: "Descrição",
        price: 0,
        imageUrl: "/placeholder.png",
        images: ["/placeholder.png"],
        stock: 1,
        status: "DRAFT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = new InMemoryProductRepository([draft]);
      const uc = new PublishProductUseCase(repo);

      await expect(
        uc.execute({
          id: "draft2",
          title: "Produto Válido",
          price: -10,
          category: "camisetas",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("lança ValidationError para categoria vazia", async () => {
      const draft: Product = {
        id: "draft3",
        title: "Draft",
        description: "Descrição",
        price: 0,
        imageUrl: "/placeholder.png",
        images: ["/placeholder.png"],
        stock: 1,
        status: "DRAFT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = new InMemoryProductRepository([draft]);
      const uc = new PublishProductUseCase(repo);

      await expect(
        uc.execute({
          id: "draft3",
          title: "Produto Válido",
          price: 49.9,
          category: "",
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
