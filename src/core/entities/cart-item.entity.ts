import type { ProductSize } from "@/core/schemas/product.schema";
import { roundCurrency } from "@/shared/money";
import type { ProductEntity } from "./product.entity";

/**
 * Interface para variantes de produto no carrinho
 */
export interface CartItemVariants {
  size?: ProductSize;
  color?: string;
}

/**
 * Entidade: CartItem
 * Representa um item no carrinho de compras
 */
export class CartItemEntity {
  productId: string;
  quantity: number;
  variants?: CartItemVariants;

  constructor(
    productId: string,
    quantity: number,
    variants?: CartItemVariants,
  ) {
    this.validateQuantity(quantity);

    this.productId = productId;
    this.quantity = quantity;
    this.variants = variants;
  }

  /**
   * Valida se a quantidade é válida
   */
  private validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
    }
    if (!Number.isInteger(quantity)) {
      throw new Error("Quantidade deve ser um número inteiro");
    }
  }

  /**
   * Atualiza a quantidade do item
   */
  updateQuantity(newQuantity: number): void {
    this.validateQuantity(newQuantity);
    this.quantity = newQuantity;
  }

  /**
   * Incrementa a quantidade
   */
  incrementQuantity(amount: number = 1): void {
    this.validateQuantity(amount);
    this.quantity += amount;
  }

  /**
   * Decrementa a quantidade
   */
  decrementQuantity(amount: number = 1): void {
    this.validateQuantity(amount);
    const newQuantity = this.quantity - amount;

    if (newQuantity < 0) {
      throw new Error("Quantidade não pode ser negativa");
    }

    this.quantity = newQuantity;
  }

  /**
   * Calcula o subtotal (sem informação do produto)
   * Para calcular com preço, use calculateSubtotal(product)
   */
  calculateSubtotal(product: ProductEntity): number {
    return roundCurrency(product.price * this.quantity);
  }

  /**
   * Verifica se o item tem variantes
   */
  hasVariants(): boolean {
    return (
      this.variants !== undefined &&
      (this.variants.size !== undefined || this.variants.color !== undefined)
    );
  }

  /**
   * Verifica se o item tem estoque suficiente (por tamanho quando aplicável)
   */
  hasStock(product: ProductEntity): boolean {
    return product.hasStock(
      this.quantity,
      this.variants?.size,
      this.variants?.color,
    );
  }

  /**
   * Valida se o item pode ser adicionado ao carrinho
   */
  validate(product: ProductEntity): { valid: boolean; error?: string } {
    if (!product.isActive) {
      return { valid: false, error: "Produto não está disponível" };
    }

    if (!this.hasStock(product)) {
      const available =
        this.variants?.size != null
          ? product.getStockForSize(this.variants.size, this.variants?.color)
          : this.variants?.color
            ? product.getTotalStockForColor(this.variants.color)
            : product.getTotalStock();
      return {
        valid: false,
        error: `Estoque insuficiente. Disponível: ${available}`,
      };
    }

    if (this.variants?.size && product.sizes) {
      const allowed = product.getAvailableSizes(this.variants?.color);
      if (!allowed.includes(this.variants.size)) {
        return {
          valid: false,
          error: `Tamanho "${this.variants.size}" não disponível`,
        };
      }
    }

    const cv = product.colorVariants;
    if (cv && cv.length > 1) {
      if (!this.variants?.color) {
        return {
          valid: false,
          error: "Selecione uma cor",
        };
      }
      const ok = cv.some((v) => v.color === this.variants?.color);
      if (!ok) {
        return {
          valid: false,
          error: `Cor "${this.variants.color}" não disponível`,
        };
      }
    } else if (this.variants?.color && product.colors?.length) {
      const colorExists = product.colors.includes(this.variants.color);
      if (!colorExists) {
        return {
          valid: false,
          error: `Cor "${this.variants.color}" não disponível`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Clona o item (nova instância independente — mutar o clone, como um
   * updateQuantity, não deve afetar o item original).
   */
  clone(): CartItemEntity {
    return new CartItemEntity(
      this.productId,
      this.quantity,
      this.variants ? { ...this.variants } : undefined,
    );
  }

  /**
   * Compara se dois itens são iguais (mesmo produto e variantes)
   */
  equals(other: CartItemEntity): boolean {
    if (this.productId !== other.productId) {
      return false;
    }

    // Compara variantes
    const thisSize = this.variants?.size;
    const otherSize = other.variants?.size;
    const thisColor = this.variants?.color;
    const otherColor = other.variants?.color;

    return thisSize === otherSize && thisColor === otherColor;
  }

  /**
   * Cria uma chave única para o item (útil para Maps)
   */
  getUniqueKey(): string {
    const variantsKey = this.variants
      ? `${this.variants.size || ""}_${this.variants.color || ""}`
      : "no-variants";

    return `${this.productId}_${variantsKey}`;
  }

  /**
   * Formata o item para exibição
   */
  formatVariants(): string {
    if (!this.hasVariants()) {
      return "";
    }

    const parts: string[] = [];

    if (this.variants?.size) {
      parts.push(`Tam: ${this.variants.size}`);
    }

    if (this.variants?.color) {
      parts.push(`Cor: ${this.variants.color}`);
    }

    return parts.length > 0 ? ` (${parts.join(", ")})` : "";
  }

  /**
   * Converte para objeto simples (para serialização)
   */
  toJSON(): {
    productId: string;
    quantity: number;
    variants?: CartItemVariants;
  } {
    return {
      productId: this.productId,
      quantity: this.quantity,
      variants: this.variants,
    };
  }

  /**
   * Cria uma instância a partir de objeto simples
   */
  static fromJSON(data: {
    productId: string;
    quantity: number;
    variants?: CartItemVariants;
  }): CartItemEntity {
    return new CartItemEntity(data.productId, data.quantity, data.variants);
  }
}
