import { describe, expect, it } from "vitest";
import type { Product } from "@/core/schemas/product.schema";
import { CartEntity } from "./cart.entity";
import { CartItemEntity } from "./cart-item.entity";
import { ProductEntity } from "./product.entity";

function makeProduct(overrides: Partial<Product> = {}): ProductEntity {
  return new ProductEntity({
    id: overrides.id ?? "prod-1",
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

function productMap(...products: ProductEntity[]): Map<string, ProductEntity> {
  return new Map(products.map((p) => [p.id as string, p]));
}

describe("CartEntity.addItem", () => {
  it("soma a quantidade em vez de duplicar quando o item já existe (mesmo produto+variantes)", () => {
    const cart = new CartEntity();
    cart.addItem(new CartItemEntity("prod-1", 2, { size: "M" }));
    cart.addItem(new CartItemEntity("prod-1", 3, { size: "M" }));

    expect(cart.getItemCount()).toBe(1);
    expect(cart.getItem("prod-1_M_")?.quantity).toBe(5);
  });

  it("mantém itens separados quando as variantes diferem", () => {
    const cart = new CartEntity();
    cart.addItem(new CartItemEntity("prod-1", 1, { size: "M" }));
    cart.addItem(new CartItemEntity("prod-1", 1, { size: "G" }));

    expect(cart.getItemCount()).toBe(2);
  });
});

describe("CartEntity.updateItemQuantity", () => {
  it("remove o item quando a quantidade é atualizada para 0", () => {
    const cart = new CartEntity([new CartItemEntity("prod-1", 2)]);
    const key = cart.getItems()[0].getUniqueKey();

    cart.updateItemQuantity(key, 0);

    expect(cart.isEmpty()).toBe(true);
  });

  it("lança erro ao atualizar um item que não está no carrinho", () => {
    const cart = new CartEntity();
    expect(() => cart.updateItemQuantity("inexistente", 1)).toThrow(
      /não encontrado/,
    );
  });
});

describe("CartEntity.calculateTotal", () => {
  it("soma o subtotal de todos os itens do carrinho", () => {
    const productA = makeProduct({ id: "a", price: 49.9 });
    const productB = makeProduct({ id: "b", price: 19.9 });

    const cart = new CartEntity([
      new CartItemEntity("a", 2),
      new CartItemEntity("b", 3),
    ]);

    // 49.9*2 + 19.9*3 = 99.8 + 59.699999999999996 (ponto flutuante puro)
    expect(cart.calculateTotal(productMap(productA, productB))).toBe(159.5);
  });

  it("lança erro se algum item referenciar um produto ausente do mapa", () => {
    const cart = new CartEntity([new CartItemEntity("desconhecido", 1)]);
    expect(() => cart.calculateTotal(new Map())).toThrow(/não encontrado/);
  });
});

describe("CartEntity.validate / hasStock / removeInvalidItems", () => {
  it("validate reporta erro por item com estoque insuficiente", () => {
    const product = makeProduct({ stock: 1 });
    const cart = new CartEntity([new CartItemEntity("prod-1", 5)]);

    const errors = cart.validate(productMap(product));

    expect(errors).toHaveLength(1);
    expect(errors[0].error).toMatch(/Estoque insuficiente/);
  });

  it("hasStock é false se qualquer item exceder o estoque disponível", () => {
    const product = makeProduct({ stock: 1 });
    const cart = new CartEntity([new CartItemEntity("prod-1", 5)]);

    expect(cart.hasStock(productMap(product))).toBe(false);
  });

  it("removeInvalidItems remove itens de produtos inativos ou sem estoque e mantém os válidos", () => {
    const active = makeProduct({ id: "ok", stock: 10 });
    const inactive = makeProduct({ id: "pausado", isActive: false, stock: 10 });
    const outOfStock = makeProduct({ id: "sem-estoque", stock: 0 });

    const cart = new CartEntity([
      new CartItemEntity("ok", 1),
      new CartItemEntity("pausado", 1),
      new CartItemEntity("sem-estoque", 1),
    ]);

    const removedCount = cart.removeInvalidItems(
      productMap(active, inactive, outOfStock),
    );

    expect(removedCount).toBe(2);
    expect(cart.getItemCount()).toBe(1);
    expect(cart.hasItem("ok_no-variants")).toBe(true);
  });
});

describe("CartEntity.applyDiscount / applyFixedDiscount", () => {
  it("aplica desconto percentual sobre o total, arredondado", () => {
    const product = makeProduct({ price: 19.9 });
    const cart = new CartEntity([new CartItemEntity("prod-1", 3)]);
    const map = productMap(product);

    // total = 59.7; 10% de desconto = 5.97 -> 53.73
    expect(cart.applyDiscount(map, 10)).toBe(53.73);
  });

  it("rejeita percentual de desconto fora do intervalo 0-100", () => {
    const cart = new CartEntity([new CartItemEntity("prod-1", 1)]);
    const map = productMap(makeProduct());
    expect(() => cart.applyDiscount(map, -1)).toThrow();
    expect(() => cart.applyDiscount(map, 101)).toThrow();
  });

  it("aplica desconto fixo sem deixar o total negativo", () => {
    const product = makeProduct({ price: 19.9 });
    const cart = new CartEntity([new CartItemEntity("prod-1", 1)]);
    const map = productMap(product);

    expect(cart.applyFixedDiscount(map, 5)).toBe(14.9);
    expect(cart.applyFixedDiscount(map, 1000)).toBe(0);
  });

  it("rejeita desconto fixo negativo", () => {
    const cart = new CartEntity([new CartItemEntity("prod-1", 1)]);
    const map = productMap(makeProduct());
    expect(() => cart.applyFixedDiscount(map, -1)).toThrow();
  });
});

describe("CartEntity.toJSON / fromJSON / clone / merge", () => {
  it("faz round-trip preservando todos os itens e quantidades", () => {
    const cart = new CartEntity([
      new CartItemEntity("a", 2, { size: "M" }),
      new CartItemEntity("b", 1),
    ]);

    const restored = CartEntity.fromJSON(cart.toJSON());

    expect(restored.getItemCount()).toBe(2);
    expect(restored.getTotalQuantity()).toBe(3);
  });

  it("clone produz um carrinho independente (mutar o clone não afeta o original)", () => {
    const cart = new CartEntity([new CartItemEntity("a", 2)]);
    const cloned = cart.clone();

    cloned.updateItemQuantity(cloned.getItems()[0].getUniqueKey(), 9);

    expect(cart.getItems()[0].quantity).toBe(2);
    expect(cloned.getItems()[0].quantity).toBe(9);
  });

  it("merge soma quantidades de itens equivalentes entre os dois carrinhos", () => {
    const cartA = new CartEntity([new CartItemEntity("a", 2)]);
    const cartB = new CartEntity([new CartItemEntity("a", 3)]);

    cartA.merge(cartB);

    expect(cartA.getItemCount()).toBe(1);
    expect(cartA.getItems()[0].quantity).toBe(5);
  });
});
