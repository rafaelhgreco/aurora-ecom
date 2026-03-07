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
  stock: number;
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
    this.stock = data.stock || 0;
    this.sizes = data.sizes;
    this.colors = data.colors;
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deletedAt = data.deletedAt || null;
  }

  isAvailable(): boolean {
    return this.isActive && this.stock > 0;
  }

  hasStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  decreaseStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new Error(
        `Estoque insuficiente. Disponível: ${this.stock}, Solicitado: ${quantity}`,
      );
    }
    this.stock -= quantity;
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
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
      stock: this.stock,
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
