import { CartItemEntity } from "./cart-item.entity";
import type { ProductEntity } from "./product.entity";

/**
 * Entidade: Cart
 * Representa o carrinho de compras com todos os seus itens
 */
export class CartEntity {
  private items: Map<string, CartItemEntity>;

  constructor(items: CartItemEntity[] = []) {
    this.items = new Map();

    for (const item of items) {
      this.items.set(item.getUniqueKey(), item);
    }
  }

  /**
   * Adiciona um item ao carrinho
   * Se o item já existe (mesmo produto e variantes), incrementa a quantidade
   */
  addItem(item: CartItemEntity): void {
    const key = item.getUniqueKey();
    const existingItem = this.items.get(key);

    if (existingItem) {
      existingItem.incrementQuantity(item.quantity);
    } else {
      this.items.set(key, item);
    }
  }

  /**
   * Remove um item do carrinho
   */
  removeItem(itemOrKey: CartItemEntity | string): boolean {
    const key =
      typeof itemOrKey === "string" ? itemOrKey : itemOrKey.getUniqueKey();

    return this.items.delete(key);
  }

  /**
   * Atualiza a quantidade de um item
   */
  updateItemQuantity(
    itemOrKey: CartItemEntity | string,
    quantity: number,
  ): void {
    const key =
      typeof itemOrKey === "string" ? itemOrKey : itemOrKey.getUniqueKey();

    const item = this.items.get(key);

    if (!item) {
      throw new Error("Item não encontrado no carrinho");
    }

    if (quantity === 0) {
      this.removeItem(key);
    } else {
      item.updateQuantity(quantity);
    }
  }

  /**
   * Atualiza as variantes de um item (ex: tamanho, cor)
   * Remove o item antigo e cria um novo com as novas variantes
   * Mantém a quantidade do item original
   */
  updateItemVariants(
    itemKey: string,
    newVariants?: CartItemEntity["variants"],
  ): void {
    const item = this.items.get(itemKey);

    if (!item) {
      throw new Error("Item não encontrado no carrinho");
    }

    // Salva a quantidade atual
    const currentQuantity = item.quantity;

    // Remove o item antigo
    this.removeItem(itemKey);

    // Cria novo item com as novas variantes
    const newItem = new CartItemEntity(
      item.productId,
      currentQuantity,
      newVariants,
    );

    // Adiciona o novo item (se já existir com essas variantes, soma a quantidade)
    this.addItem(newItem);
  }

  /**
   * Obtém um item específico
   */
  getItem(itemOrKey: CartItemEntity | string): CartItemEntity | undefined {
    const key =
      typeof itemOrKey === "string" ? itemOrKey : itemOrKey.getUniqueKey();

    return this.items.get(key);
  }

  /**
   * Obtém todos os itens do carrinho
   */
  getItems(): CartItemEntity[] {
    return Array.from(this.items.values());
  }

  /**
   * Verifica se o carrinho contém um item
   */
  hasItem(itemOrKey: CartItemEntity | string): boolean {
    const key =
      typeof itemOrKey === "string" ? itemOrKey : itemOrKey.getUniqueKey();

    return this.items.has(key);
  }

  /**
   * Retorna o número total de itens diferentes
   */
  getItemCount(): number {
    return this.items.size;
  }

  /**
   * Retorna a quantidade total de produtos (soma de todas as quantidades)
   */
  getTotalQuantity(): number {
    return Array.from(this.items.values()).reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }

  /**
   * Verifica se o carrinho está vazio
   */
  isEmpty(): boolean {
    return this.items.size === 0;
  }

  /**
   * Limpa o carrinho
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Calcula o total do carrinho
   * Requer um mapeamento de produtos (productId -> ProductEntity)
   */
  calculateTotal(products: Map<string, ProductEntity>): number {
    let total = 0;

    for (const item of this.items.values()) {
      const product = products.get(item.productId);

      if (!product) {
        throw new Error(`Produto ${item.productId} não encontrado`);
      }

      total += item.calculateSubtotal(product);
    }

    return total;
  }

  /**
   * Valida todos os itens do carrinho
   * Retorna array com erros encontrados
   */
  validate(products: Map<string, ProductEntity>): Array<{
    item: CartItemEntity;
    error: string;
  }> {
    const errors: Array<{ item: CartItemEntity; error: string }> = [];

    for (const item of this.items.values()) {
      const product = products.get(item.productId);

      if (!product) {
        errors.push({
          item,
          error: `Produto ${item.productId} não encontrado`,
        });
        continue;
      }

      const validation = item.validate(product);
      if (!validation.valid && validation.error) {
        errors.push({ item, error: validation.error });
      }
    }

    return errors;
  }

  /**
   * Verifica se todos os itens têm estoque suficiente
   */
  hasStock(products: Map<string, ProductEntity>): boolean {
    for (const item of this.items.values()) {
      const product = products.get(item.productId);

      if (!product || !item.hasStock(product)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Remove itens inativos ou sem estoque
   */
  removeInvalidItems(products: Map<string, ProductEntity>): number {
    const keysToRemove: string[] = [];

    for (const item of this.items.values()) {
      const product = products.get(item.productId);

      if (!product || !product.isActive || !item.hasStock(product)) {
        keysToRemove.push(item.getUniqueKey());
      }
    }

    for (const key of keysToRemove) {
      this.items.delete(key);
    }

    return keysToRemove.length;
  }

  /**
   * Aplica desconto percentual em todos os itens
   */
  applyDiscount(
    products: Map<string, ProductEntity>,
    discountPercentage: number,
  ): number {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Desconto deve estar entre 0 e 100");
    }

    const originalTotal = this.calculateTotal(products);
    const discountAmount = originalTotal * (discountPercentage / 100);

    return originalTotal - discountAmount;
  }

  /**
   * Calcula desconto em valor fixo
   */
  applyFixedDiscount(
    products: Map<string, ProductEntity>,
    discountAmount: number,
  ): number {
    if (discountAmount < 0) {
      throw new Error("Desconto não pode ser negativo");
    }

    const originalTotal = this.calculateTotal(products);
    const finalTotal = Math.max(0, originalTotal - discountAmount);

    return finalTotal;
  }

  /**
   * Converte para array simples (para serialização)
   */
  toJSON(): Array<ReturnType<CartItemEntity["toJSON"]>> {
    return Array.from(this.items.values()).map((item) => item.toJSON());
  }

  /**
   * Cria uma instância a partir de array simples
   */
  static fromJSON(
    data: Array<Parameters<typeof CartItemEntity.fromJSON>[0]>,
  ): CartEntity {
    const items = data.map((itemData) => CartItemEntity.fromJSON(itemData));
    return new CartEntity(items);
  }

  /**
   * Clona o carrinho
   */
  clone(): CartEntity {
    return new CartEntity(this.getItems());
  }

  /**
   * Mescla outro carrinho com este
   */
  merge(otherCart: CartEntity): void {
    for (const item of otherCart.getItems()) {
      this.addItem(item);
    }
  }
}
