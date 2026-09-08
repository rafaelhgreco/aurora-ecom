import type {
  Product,
  ProductColorVariant,
  ProductSize,
  ProductStatus,
} from "@/core/schemas/product.schema";
import {
  getAvailableSizes as getAvailableSizesHelper,
  getStockForSize as getStockForSizeHelper,
  getTotalStockForColor as getTotalStockForColorHelper,
  getTotalStock as getTotalStockHelper,
  hasVariantLevelStock,
} from "@/shared/product-stock-helpers";

export class ProductEntity implements Product {
  id?: string;
  barcode?: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  imageUrl: string;
  images: string[];
  category?: string;
  shopCategory?: string;
  stock: number;
  stockBySize?: Record<string, number>;
  sizes?: ProductSize[];
  colors?: string[];
  colorVariants?: ProductColorVariant[];
  isActive: boolean;
  status: ProductStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  constructor(data: Product & { deletedAt?: Date | null }) {
    this.id = data.id;
    this.barcode = data.barcode;
    this.slug = data.slug;
    this.title = data.title;
    this.subtitle = data.subtitle;
    this.description = data.description;
    this.price = data.price;
    this.imageUrl = data.imageUrl;
    this.images = data.images || [];
    this.category = data.category;
    this.shopCategory = data.shopCategory;
    this.stock = data.stock || 0;
    this.stockBySize = data.stockBySize;
    this.sizes = data.sizes;
    this.colors = data.colors;
    this.colorVariants = data.colorVariants;
    this.isActive = data.isActive ?? true;
    this.status = data.status ?? "ACTIVE";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deletedAt = data.deletedAt || null;
  }

  getTotalStock(): number {
    return getTotalStockHelper(this);
  }

  getTotalStockForColor(color: string): number {
    return getTotalStockForColorHelper(this, color);
  }

  getStockForSize(size: ProductSize, color?: string): number {
    return getStockForSizeHelper(this, size, color);
  }

  getAvailableSizes(color?: string): ProductSize[] {
    return getAvailableSizesHelper(this, color);
  }

  hasStock(quantity: number, size?: ProductSize, color?: string): boolean {
    if (size != null) {
      return this.getStockForSize(size, color) >= quantity;
    }
    if (color) {
      return this.getTotalStockForColor(color) >= quantity;
    }
    return this.getTotalStock() >= quantity;
  }

  hasStockForSize(
    size: ProductSize,
    quantity: number,
    color?: string,
  ): boolean {
    return this.getStockForSize(size, color) >= quantity;
  }

  isAvailable(): boolean {
    return this.isActive && this.getTotalStock() > 0;
  }

  decreaseStock(quantity: number, size?: ProductSize, color?: string): void {
    if (hasVariantLevelStock(this) && color && size != null) {
      const idx = this.colorVariants?.findIndex((v) => v.color === color) ?? -1;
      if (idx < 0) {
        throw new Error(`Cor "${color}" inválida para este produto`);
      }
      const v = this.colorVariants?.[idx];
      if (!v) {
        throw new Error(`Cor "${color}" inválida para este produto`);
      }
      const sb = { ...(v.stockBySize ?? {}) };
      const current = sb[size] ?? 0;
      if (current < quantity) {
        throw new Error(
          `Estoque insuficiente para tamanho ${size}. Disponível: ${current}, Solicitado: ${quantity}`,
        );
      }
      sb[size] = current - quantity;
      const next = [...(this.colorVariants ?? [])];
      next[idx] = { ...v, stockBySize: sb };
      this.colorVariants = next;

      this.stock = Math.max(0, this.stock - quantity);
      if (this.stockBySize && this.sizes?.includes(size)) {
        this.stockBySize = {
          ...this.stockBySize,
          [size]: Math.max(0, (this.stockBySize[size] ?? 0) - quantity),
        };
      }
      return;
    }

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

  increaseStock(quantity: number, size?: ProductSize, color?: string): void {
    if (quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
    }
    if (hasVariantLevelStock(this) && color && size != null) {
      const idx = this.colorVariants?.findIndex((v) => v.color === color) ?? -1;
      if (idx < 0) {
        throw new Error(`Cor "${color}" inválida para este produto`);
      }
      const v = this.colorVariants?.[idx];
      if (!v) {
        throw new Error(`Cor "${color}" inválida para este produto`);
      }
      const sb = { ...(v.stockBySize ?? {}) };
      sb[size] = (sb[size] ?? 0) + quantity;
      const next = [...(this.colorVariants ?? [])];
      next[idx] = { ...v, stockBySize: sb };
      this.colorVariants = next;

      this.stock += quantity;
      if (this.stockBySize && this.sizes?.includes(size)) {
        this.stockBySize = {
          ...this.stockBySize,
          [size]: (this.stockBySize[size] ?? 0) + quantity,
        };
      }
      return;
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

  publish(): void {
    this.status = "ACTIVE";
  }

  isDraft(): boolean {
    return this.status === "DRAFT";
  }

  toJSON(): Product {
    return {
      id: this.id,
      barcode: this.barcode,
      slug: this.slug,
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
      colorVariants: this.colorVariants,
      isActive: this.isActive,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromDatabase(data: Product): ProductEntity {
    return new ProductEntity(data);
  }
}
