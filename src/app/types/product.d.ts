import type { Product as ProductEntity } from "@/core/entities/product.entity";

/**
 * Tipo do produto (reutiliza da entidade)
 */
export type Product = ProductEntity;

/**
 * Dados para criar produto
 */
export interface CreateProductData {
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  imageUrl: string;
  images: string[];
  category?: string;
  stock: number;
  sizes?: Array<"PP" | "P" | "M" | "G" | "GG" | "XG">;
  colors?: string[];
  isActive: boolean;
}

/**
 * Dados para atualizar produto
 */
export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

/**
 * Filtros de busca
 */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  search?: string;
}

/**
 * Estado de carregamento genérico
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Resposta de ação (Server Action)
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Modo de visualização da lista
 */
export type ViewMode = "grid" | "list" | "table";

/**
 * Ordenação
 */
export interface SortConfig {
  field: keyof Product;
  direction: "asc" | "desc";
}
