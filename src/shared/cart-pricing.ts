/**
 * Precificação e validação de estoque para itens do carrinho no checkout.
 * Funções puras (sem I/O) para poder testar sem depender do Firestore — a
 * busca do produto continua sendo responsabilidade de quem chama.
 */

import type { ProductSize } from "@/core/schemas/product.schema";
import { roundCurrency, sumCurrency } from "./money";

export interface CartLineInput {
  productId: string;
  quantity: number;
  variants?: { size?: string; color?: string };
}

/** Produto mínimo necessário para precificar/validar uma linha do carrinho. */
export interface PriceableProduct {
  id?: string;
  title: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  getStockForSize(size: ProductSize, color?: string): number;
  getTotalStockForColor(color: string): number;
  getTotalStock(): number;
}

export interface PricedCartLine {
  productId: string;
  quantity: number;
  variants?: { size?: string; color?: string };
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
    isActive: boolean;
    stock: number;
  };
  subtotal: number;
}

/** Chave que identifica a mesma combinação produto+variante entre linhas diferentes. */
export function cartLineVariantKey(item: CartLineInput): string {
  return `${item.productId}::${item.variants?.size ?? ""}::${item.variants?.color ?? ""}`;
}

/**
 * Soma a quantidade pedida por combinação produto+variante.
 *
 * Necessário porque validar estoque linha a linha não impede que a mesma
 * combinação produto+variante apareça em duas linhas separadas — cada uma
 * isoladamente dentro do estoque disponível, mas juntas excedendo-o (ex.:
 * 90 + 90 unidades pedidas de um produto com 100 em estoque).
 */
export function aggregateQuantitiesByVariant(
  items: CartLineInput[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    const key = cartLineVariantKey(item);
    totals.set(key, (totals.get(key) ?? 0) + item.quantity);
  }
  return totals;
}

/**
 * Valida o formato básico das linhas do carrinho recebidas do cliente.
 * Preço e estoque nunca vêm do cliente — são sempre recalculados a partir
 * dos dados do produto no servidor (ver `priceCartLine`).
 */
export function validateCartLinesShape(items: CartLineInput[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: "Carrinho vazio" };
  }

  for (const item of items) {
    if (!item.productId || typeof item.productId !== "string") {
      return { valid: false, error: "ID de produto inválido" };
    }
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > 100
    ) {
      return {
        valid: false,
        error: "Quantidade inválida (deve ser um número inteiro entre 1 e 100)",
      };
    }
  }

  return { valid: true };
}

/**
 * Precifica uma linha do carrinho e valida a disponibilidade de estoque
 * contra a quantidade total pedida daquela combinação produto+variante em
 * todo o carrinho (não só desta linha — ver `aggregateQuantitiesByVariant`).
 *
 * Lança erro se o produto estiver inativo ou sem estoque suficiente.
 *
 * @param unitPriceOverride Preço unitário a cobrar no lugar de `product.price`
 *   (preço efetivo já resolvido com a promoção, se houver — ver
 *   `computeEffectivePrice`). Quem chama decide se a promoção se aplica; esta
 *   função só usa o número que recebe.
 */
export function priceCartLine(
  item: CartLineInput,
  product: PriceableProduct,
  totalRequestedForVariant: number,
  unitPriceOverride?: number,
): PricedCartLine {
  if (!product.isActive) {
    throw new Error(`Produto "${product.title}" não está disponível`);
  }

  const available =
    item.variants?.size != null
      ? product.getStockForSize(
          item.variants.size as ProductSize,
          item.variants.color,
        )
      : item.variants?.color
        ? product.getTotalStockForColor(item.variants.color)
        : product.getTotalStock();

  if (available < totalRequestedForVariant) {
    throw new Error(
      `Estoque insuficiente para "${product.title}". Disponível: ${available}`,
    );
  }

  const unitPrice = unitPriceOverride ?? product.price;

  return {
    productId: item.productId,
    quantity: item.quantity,
    variants: item.variants,
    product: {
      id: product.id || "",
      title: product.title,
      price: unitPrice,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      stock: product.stock,
    },
    subtotal: roundCurrency(unitPrice * item.quantity),
  };
}

/** Soma os subtotais já precificados de todas as linhas do carrinho. */
export function sumCartLines(lines: { subtotal: number }[]): number {
  return sumCurrency(lines.map((line) => line.subtotal));
}
