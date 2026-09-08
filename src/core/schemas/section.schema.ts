import { z } from "zod";

export const sectionObjectSchema = z.object({
  /** IDs do Firestore não são UUID; aceita qualquer string não vazia.
   *  As duas seções originais (Roupas/Cabelos) usam os ids fixos "roupas" e
   *  "cabelos" para manter compatibilidade com a importação em massa e com
   *  produtos já cadastrados. */
  id: z.string().min(1, "ID inválido").optional(),

  name: z
    .string({ message: "Nome é obrigatório" })
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),

  /** URL amigável (`/loja/{slug}`). Gerada a partir do nome, editável. */
  slug: z
    .string({ message: "URL é obrigatória" })
    .min(1, "URL não pode ficar vazia")
    .max(60, "URL deve ter no máximo 60 caracteres")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens",
    ),

  description: z
    .string()
    .max(200, "Descrição deve ter no máximo 200 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),

  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
});

export const sectionSchema = sectionObjectSchema;

export const serializedSectionSchema = sectionObjectSchema.extend({
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export const createSectionSchema = sectionObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSectionSchema = sectionObjectSchema
  .partial()
  .required({ id: true });

export type Section = z.infer<typeof sectionSchema>;
export type SerializedSection = z.infer<typeof serializedSectionSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
