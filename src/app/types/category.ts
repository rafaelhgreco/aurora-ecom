/**
 * Tipos de categoria alinhados ao schema Zod (fonte única).
 * `Category` aqui é o formato serializado retornado pelas Server Actions (datas em string).
 */

export type {
  CreateCategoryInput,
  SerializedCategory as Category,
  UpdateCategoryInput,
} from "@/core/schemas/category.schema";
