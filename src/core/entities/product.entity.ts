import type { ShopCategoryId } from "@/core/catalog/shop-catalog";
import type { Product, ProductSize } from "../schemas/product.schema";

export class ProductEntity implements Product {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  imageUrl: string;
  images: string[];
  category?: string;
  shopCategory?: ShopCategoryId;
  stock: number;
  stockBySize?: Partial<Record<ProductSize, number>>;
  sizes?: ProductSize[];
  colors?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  constructor(data: Product & { deletedAt?: Date | null }) {
    this.id = data.id;
    this.title = data.title;
    this.subtitle = data.subtitle;
    this.description = data.description;
    this.price = data.price;
    this.imageUrl = data.imageUrl;
    this.images = data.images || [];
    this.category = data.category;
    this.shopCategory = data.shopCategory as ShopCategoryId | undefined;
    this.stock = data.stock || 0;
    this.stockBySize = data.stockBySize;
    this.sizes = data.sizes;
    this.colors = data.colors;
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deletedAt = data.deletedAt || null;
  }

  /**
   * Estoque total. Usa stockBySize quando produto tem sizes e stockBySize definido.
   */
  getTotalStock(): number {
    if (this.stockBySize && this.sizes && this.sizes.length > 0) {
      return this.sizes.reduce(
        (sum, s) => sum + (this.stockBySize?.[s] ?? 0),
        0,
      );
    }
    return this.stock;
  }

  /**
   * Estoque para um tamanho específico. Retorna 0 quando stockBySize ausente ou size inexistente.
   */
  getStockForSize(size: ProductSize): number {
    return this.stockBySize?.[size] ?? 0;
  }

  /**
   * Verifica se há estoque suficiente. Aceita size opcional para produtos com tamanhos.
   */
  hasStock(quantity: number, size?: ProductSize): boolean {
    if (size != null && this.stockBySize && this.sizes?.includes(size)) {
      return this.getStockForSize(size) >= quantity;
    }
    return this.getTotalStock() >= quantity;
  }

  hasStockForSize(size: ProductSize, quantity: number): boolean {
    return this.getStockForSize(size) >= quantity;
  }

  /** Tamanhos com estoque > 0 (quando usa stockBySize). Caso contrário retorna sizes inteiros. */
  getAvailableSizes(): ProductSize[] {
    if (this.stockBySize && this.sizes && this.sizes.length > 0) {
      return this.sizes.filter((s) => (this.stockBySize?.[s] ?? 0) > 0);
    }
    if (this.stock > 0 && this.sizes && this.sizes.length > 0) {
      return this.sizes;
    }
    return [];
  }

  isAvailable(): boolean {
    return this.isActive && this.getTotalStock() > 0;
  }

  decreaseStock(quantity: number, size?: ProductSize): void {
    if (size != null && this.stockBySize && this.sizes?.includes(size)) {
      const current = this.getStockForSize(size);
      if (current < quantity) {
        throw new Error(
          `Estoque insuficiente para tamanho ${size}. Disponível: ${current}, Solicitado: ${quantity}`,
        );
      }
      this.stockBySize = {
        ...this.stockBySize,
        [size]: current - quantity,
      };
      return;
    }
    if (!this.hasStock(quantity)) {
      throw new Error(
        `Estoque insuficiente. Disponível: ${this.getTotalStock()}, Solicitado: ${quantity}`,
      );
    }
    this.stock -= quantity;
  }

  increaseStock(quantity: number, size?: ProductSize): void {
    if (quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
    }
    if (size != null && this.sizes?.includes(size)) {
      this.stockBySize = {
        ...this.stockBySize,
        [size]: (this.stockBySize?.[size] ?? 0) + quantity,
      };
      return;
    }
    this.stock += quantity;
  }

  getPriceWithDiscount(discountPercentage: number): number {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Desconto deve estar entre 0 e 100");
    }
    return this.price * (1 - discountPercentage / 100);
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  toJSON(): Product {
    return {
      id: this.id,
      title: this.title,
      subtitle: this.subtitle,
      description: this.description,
      price: this.price,
      imageUrl: this.imageUrl,
      images: this.images,
      category: this.category,
      shopCategory: this.shopCategory,
      stock: this.stock,
      stockBySize: this.stockBySize,
      sizes: this.sizes,
      colors: this.colors,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromDatabase(data: Product): ProductEntity {
    return new ProductEntity(data);
  }
}
