import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import { InMemoryProductRepository } from "@/infrastructure/repositories/in-memory-product.repository";
import { ScanBarcodeUseCase } from "./scan-barcode.use-case";

describe("ScanBarcodeUseCase", () => {
  let repository: InMemoryProductRepository;
  let useCase: ScanBarcodeUseCase;

  beforeEach(() => {
    repository = new InMemoryProductRepository([]);
    useCase = new ScanBarcodeUseCase(repository);
  });

  describe("Cenário: Escanear um código de barras de um produto inédito", () => {
    it("cria um novo produto DRAFT com stock=1", async () => {
      const result = await useCase.execute({ barcode: "789102030" });

      expect(result.created).toBe(true);
      expect(result.product.status).toBe("DRAFT");
      expect(result.product.stock).toBe(1);
      expect(result.product.barcode).toBe("789102030");
    });

    it("produto criado tem título e descrição placeholder", async () => {
      const result = await useCase.execute({ barcode: "789102030" });

      expect(result.product.title).toContain("789102030");
      expect(result.product.description).toBeDefined();
    });
  });

  describe("Cenário: Escanear um código de barras de um produto já existente", () => {
    it("incrementa stock para 6 e mantém status DRAFT inalterado", async () => {
      const existing: Product = {
        id: "111222333",
        barcode: "111222333",
        title: "Produto Bipado",
        description: "Descrição",
        price: 0,
        imageUrl: "/placeholder.png",
        images: ["/placeholder.png"],
        stock: 5,
        status: "DRAFT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = new InMemoryProductRepository([existing]);
      const uc = new ScanBarcodeUseCase(repo);

      const result = await uc.execute({ barcode: "111222333" });

      expect(result.created).toBe(false);
      expect(result.product.stock).toBe(6);
      expect(result.product.status).toBe("DRAFT");
    });

    it("incrementa stock para 16 e mantém status ACTIVE inalterado", async () => {
      const existing: Product = {
        id: "333444555",
        barcode: "333444555",
        title: "Produto Publicado",
        description: "Descrição",
        price: 49.9,
        imageUrl: "https://example.com/img.jpg",
        images: ["https://example.com/img.jpg"],
        stock: 15,
        status: "ACTIVE",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = new InMemoryProductRepository([existing]);
      const uc = new ScanBarcodeUseCase(repo);

      const result = await uc.execute({ barcode: "333444555" });

      expect(result.created).toBe(false);
      expect(result.product.stock).toBe(16);
      expect(result.product.status).toBe("ACTIVE");
    });
  });
});
