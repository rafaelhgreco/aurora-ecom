/**
 * Tipos de produto alinhados ao schema Zod (fonte única).
 * `Product` aqui é o formato serializado retornado pelas Server Actions (datas em string).
 */

export type {
  CreateProductInput,
  SerializedProduct,
  UpdateProductInput,
} from "@/core/schemas/product.schema";

export type { SerializedProduct as Product } from "@/core/schemas/product.schema";

/** Modo de visualização da lista no admin */
export type ViewMode = "grid" | "list" | "table";
