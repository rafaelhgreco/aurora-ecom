import { randomUUID } from "node:crypto";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { Product, ProductFilter } from "@/core/schemas/product.schema";
import { NotFoundError } from "@/shared/errors/domain-errors";

const DEFAULT_SEED_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "Camiseta Básica Branca",
    subtitle: "Algodão Premium",
    description:
      "Camiseta básica confeccionada em algodão 100% premium. Modelagem regular fit que proporciona conforto durante todo o dia. Perfeita para compor looks casuais.",
    price: 89.9,
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    ],
    category: "Camisetas",
    shopCategory: "roupas",
    stock: 50,
    sizes: ["P", "M", "G", "GG"],
    colors: ["Branco"],
    isActive: true,
    status: "ACTIVE",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Camiseta Preta Estampada",
    subtitle: "Coleção Verão",
    description:
      "Camiseta estampada da coleção verão. Design exclusivo e moderno. Tecido leve e respirável, ideal para dias quentes.",
    price: 119.9,
    imageUrl:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
    ],
    category: "Camisetas",
    shopCategory: "roupas",
    stock: 30,
    sizes: ["P", "M", "G"],
    colors: ["Preto"],
    isActive: true,
    status: "ACTIVE",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    title: "Camiseta Cinza Mescla",
    subtitle: "Algodão Premium",
    description:
      "Camiseta em malha mescla de alta qualidade. Acabamento impecável e durabilidade garantida. Modelagem confortável.",
    price: 89.9,
    imageUrl:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop",
    ],
    category: "Camisetas",
    shopCategory: "roupas",
    stock: 45,
    sizes: ["PP", "P", "M", "G", "GG"],
    colors: ["Cinza"],
    isActive: true,
    status: "ACTIVE",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    id: "4",
    title: "Camiseta Listrada",
    subtitle: "Edição Limitada",
    description:
      "Camiseta com listras em edição limitada. Design atemporal e versátil. Perfeita para qualquer ocasião casual.",
    price: 149.9,
    imageUrl:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop",
    ],
    category: "Camisetas",
    shopCategory: "roupas",
    stock: 15,
    sizes: ["M", "G"],
    colors: ["Branco", "Azul"],
    isActive: true,
    status: "ACTIVE",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
];

export class InMemoryProductRepository implements IProductRepository {
  private products: Product[];

  constructor(seed: Product[] = DEFAULT_SEED_PRODUCTS) {
    this.products = [...seed];
  }

  async findAll(
    filter?: ProductFilter,
  ): Promise<{ data: Product[]; totalCount: number }> {
    let filtered = [...this.products];

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter((p) => p.category === filter.category);
      }

      if (filter.minPrice !== undefined) {
        filtered = filtered.filter((p) => p.price >= (filter.minPrice ?? 0));
      }

      if (filter.maxPrice !== undefined) {
        filtered = filtered.filter(
          (p) => p.price <= (filter.maxPrice ?? Number.POSITIVE_INFINITY),
        );
      }

      if (filter.isActive !== undefined) {
        filtered = filtered.filter((p) => p.isActive === filter.isActive);
      }

      if (filter.status !== undefined) {
        filtered = filtered.filter((p) => p.status === filter.status);
      }

      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search),
        );
      }

      if (filter.sizes && filter.sizes.length > 0) {
        filtered = filtered.filter((p) =>
          p.sizes?.some((size) => filter.sizes?.includes(size)),
        );
      }

      if (filter.shopCategory) {
        const target = filter.shopCategory;
        filtered = filtered.filter(
          (p) => (p.shopCategory ?? "roupas") === target,
        );
      }
    }

    const totalCount = filtered.length;

    if (filter) {
      const limit = filter.limitCount ?? 20;
      const page = filter.page ?? 1;
      const offset = (page - 1) * limit;
      filtered = filtered.slice(offset, offset + limit);
    }

    return { data: filtered, totalCount };
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) || null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.products.find((p) => p.slug === slug) || null;
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.products.find((p) => p.barcode === barcode) || null;
  }

  async create(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.push(newProduct);
    return newProduct;
  }

  async createDraftByBarcode(
    barcode: string,
    draftFactory: () => Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product> {
    const draft = draftFactory();
    const newProduct: Product = {
      ...draft,
      id: barcode,
      barcode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.push(newProduct);
    return newProduct;
  }

  async incrementStockByBarcode(
    barcode: string,
    incrementBy: number,
  ): Promise<Product> {
    const existing = this.products.find((p) => p.barcode === barcode);
    if (!existing) {
      throw new NotFoundError("Produto", barcode);
    }
    existing.stock += incrementBy;
    existing.updatedAt = new Date();
    return existing;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error(`Produto com ID ${id} não encontrado`);
    }

    this.products[index] = {
      ...this.products[index],
      ...updates,
      id, // Garante que o ID não mude
      updatedAt: new Date(),
    };

    return this.products[index];
  }

  async bulkUpdateCategory(
    productIds: string[],
    category: string,
  ): Promise<{ updatedCount: number; failedIds: string[] }> {
    let updatedCount = 0;
    const failedIds: string[] = [];

    for (const id of productIds) {
      const index = this.products.findIndex((p) => p.id === id);
      if (index === -1) {
        failedIds.push(id);
        continue;
      }
      this.products[index] = {
        ...this.products[index],
        category,
        updatedAt: new Date(),
      };
      updatedCount += 1;
    }

    return { updatedCount, failedIds };
  }

  async delete(id: string): Promise<void> {
    const index = this.products.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error(`Produto com ID ${id} não encontrado`);
    }

    this.products.splice(index, 1);
  }

  async exists(id: string): Promise<boolean> {
    return this.products.some((p) => p.id === id);
  }
}

export const productRepository = new InMemoryProductRepository();
