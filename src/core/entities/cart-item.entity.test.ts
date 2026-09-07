import { describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import { CartItemEntity } from "./cart-item.entity";
import { ProductEntity } from "./product.entity";

function makeProduct(overrides: Partial<Product> = {}): ProductEntity {
  return new ProductEntity({
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
  });
}

describe("CartItemEntity — quantidade", () => {
  it("rejeita quantidade zero ou negativa na criação", () => {
    expect(() => new CartItemEntity("prod-1", 0)).toThrow();
    expect(() => new CartItemEntity("prod-1", -1)).toThrow();
  });

  it("rejeita quantidade fracionária na criação", () => {
    expect(() => new CartItemEntity("prod-1", 1.5)).toThrow(/inteiro/);
  });

  it("updateQuantity rejeita valores inválidos e preserva o valor anterior", () => {
    const item = new CartItemEntity("prod-1", 2);
    expect(() => item.updateQuantity(0)).toThrow();
    expect(() => item.updateQuantity(-3)).toThrow();
    expect(() => item.updateQuantity(1.5)).toThrow();
    expect(item.quantity).toBe(2);
  });

  it("incrementQuantity soma corretamente e decrementQuantity nunca fica negativo", () => {
    const item = new CartItemEntity("prod-1", 2);
    item.incrementQuantity(3);
    expect(item.quantity).toBe(5);

    item.decrementQuantity(2);
    expect(item.quantity).toBe(3);

    expect(() => item.decrementQuantity(10)).toThrow(/negativa/);
    expect(item.quantity).toBe(3);
  });
});

describe("CartItemEntity.calculateSubtotal", () => {
  it("multiplica preço unitário pela quantidade", () => {
    const product = makeProduct({ price: 49.9 });
    const item = new CartItemEntity("prod-1", 2);
    expect(item.calculateSubtotal(product)).toBe(99.8);
  });

  it("arredonda o resultado para 2 casas decimais mesmo com erro de ponto flutuante", () => {
    const product = makeProduct({ price: 19.9 });
    const item = new CartItemEntity("prod-1", 3);
    // 19.9 * 3 dá 59.699999999999996 em ponto flutuante puro
    expect(item.calculateSubtotal(product)).toBe(59.7);
  });
});

describe("CartItemEntity.hasStock / validate", () => {
  it("hasStock considera estoque simples quando não há tamanho/cor", () => {
    const product = makeProduct({ stock: 3 });
    expect(new CartItemEntity("prod-1", 3).hasStock(product)).toBe(true);
    expect(new CartItemEntity("prod-1", 4).hasStock(product)).toBe(false);
  });

  it("hasStock considera estoque por tamanho quando o item tem variante de tamanho", () => {
    const product = makeProduct({
      sizes: ["P", "M"],
      stockBySize: { P: 1, M: 5 },
    });
    const item = new CartItemEntity("prod-1", 2, { size: "P" });
    expect(item.hasStock(product)).toBe(false);

    const okItem = new CartItemEntity("prod-1", 2, { size: "M" });
    expect(okItem.hasStock(product)).toBe(true);
  });

  it("validate bloqueia produto inativo mesmo com estoque suficiente", () => {
    const product = makeProduct({ isActive: false, stock: 10 });
    const item = new CartItemEntity("prod-1", 1);
    const result = item.validate(product);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/não está disponível/);
  });

  it("validate exige cor quando o produto tem mais de uma variante de cor", () => {
    const product = makeProduct({
      colorVariants: [
        { color: "Preto", images: ["https://example.com/preto.jpg"] },
        { color: "Branco", images: ["https://example.com/branco.jpg"] },
      ],
    });
    const item = new CartItemEntity("prod-1", 1);
    const result = item.validate(product);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Selecione uma cor/);
  });

  it("validate aceita item consistente com o produto", () => {
    const product = makeProduct({ stock: 5 });
    const item = new CartItemEntity("prod-1", 2);
    expect(item.validate(product)).toEqual({ valid: true });
  });
});

describe("CartItemEntity.getUniqueKey / equals", () => {
  it("itens com mesmo produto e mesmas variantes têm a mesma chave", () => {
    const a = new CartItemEntity("prod-1", 1, { size: "M", color: "Preto" });
    const b = new CartItemEntity("prod-1", 9, { size: "M", color: "Preto" });
    expect(a.getUniqueKey()).toBe(b.getUniqueKey());
    expect(a.equals(b)).toBe(true);
  });

  it("itens com variantes diferentes têm chaves diferentes", () => {
    const a = new CartItemEntity("prod-1", 1, { size: "M" });
    const b = new CartItemEntity("prod-1", 1, { size: "G" });
    expect(a.getUniqueKey()).not.toBe(b.getUniqueKey());
    expect(a.equals(b)).toBe(false);
  });
});

describe("CartItemEntity.toJSON / fromJSON", () => {
  it("faz round-trip preservando produto, quantidade e variantes", () => {
    const item = new CartItemEntity("prod-1", 4, { size: "M", color: "Azul" });
    const restored = CartItemEntity.fromJSON(item.toJSON());

    expect(restored.productId).toBe(item.productId);
    expect(restored.quantity).toBe(item.quantity);
    expect(restored.variants).toEqual(item.variants);
    expect(restored.getUniqueKey()).toBe(item.getUniqueKey());
  });
});
