import { z } from "zod";

export const categoryObjectSchema = z.object({
  /** IDs do Firestore não são UUID; aceita qualquer string não vazia */
  id: z.string().min(1, "ID inválido").optional(),

  /** Seção do catálogo a que esta subcategoria pertence (Seção 1:N Subcategoria). */
  sectionId: z
    .string({ message: "Seção é obrigatória" })
    .min(1, "Seção é obrigatória"),

  name: z
    .string({ message: "Nome é obrigatório" })
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),

  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
});

export const categorySchema = categoryObjectSchema;

/** Formato devolvido pelas Server Actions ao cliente: datas em string ISO. */
export const serializedCategorySchema = categoryObjectSchema.extend({
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createCategorySchema = categoryObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCategorySchema = categoryObjectSchema
  .partial()
  .required({ id: true });

export type Category = z.infer<typeof categorySchema>;
export type SerializedCategory = z.infer<typeof serializedCategorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
