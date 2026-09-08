/**
 * Tipos de seção alinhados ao schema Zod (fonte única).
 * `Section` aqui é o formato serializado retornado pelas Server Actions (datas em string).
 */

export type {
  CreateSectionInput,
  UpdateSectionInput,
} from "@/core/schemas/section.schema";

export type { SerializedSection as Section } from "@/core/schemas/section.schema";
