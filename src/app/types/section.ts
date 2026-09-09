/**
 * Tipos de seção alinhados ao schema Zod (fonte única).
 * `Section` aqui é o formato serializado retornado pelas Server Actions (datas em string).
 */

export type {
  CreateSectionInput,
  SerializedSection as Section,
  UpdateSectionInput,
} from "@/core/schemas/section.schema";
