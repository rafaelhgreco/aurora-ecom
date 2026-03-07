import type { ProductSize } from "../schemas/product.schema";
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
    return product.price * this.quantity;
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
   * Verifica se o item tem estoque suficiente
   */
  hasStock(product: ProductEntity): boolean {
    return product.hasStock(this.quantity);
  }

  /**
   * Valida se o item pode ser adicionado ao carrinho
   */
  validate(product: ProductEntity): { valid: boolean; error?: string } {
    if (!product.isActive) {
      return { valid: false, error: "Produto não está disponível" };
    }

    if (!this.hasStock(product)) {
      return {
        valid: false,
        error: `Estoque insuficiente. Disponível: ${product.stock}`,
      };
    }

    // Valida tamanho se especificado
    if (this.variants?.size && product.sizes) {
      const sizeExists = product.sizes.includes(this.variants.size);
      if (!sizeExists) {
        return {
          valid: false,
          error: `Tamanho "${this.variants.size}" não disponível`,
        };
      }
    }

    // Valida cor se especificado
    if (this.variants?.color && product.colors) {
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
