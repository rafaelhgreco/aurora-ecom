import { z } from "zod";

export const promotionObjectSchema = z.object({
  /** IDs do Firestore não são UUID; aceita qualquer string não vazia */
  id: z.string().min(1, "ID inválido").optional(),

  name: z
    .string({ message: "Nome é obrigatório" })
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),

  /** Percentual aplicado sobre o preço de tabela (ou `promotionOverridePrice`, quando definido). */
  discountPercentage: z
    .number({ message: "Percentual de desconto é obrigatório" })
    .min(0, "Desconto não pode ser negativo")
    .max(100, "Desconto não pode ser maior que 100%"),

  active: z.boolean().default(true),

  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
});

export const promotionSchema = promotionObjectSchema;

/** Formato devolvido pelas Server Actions ao cliente: datas em string ISO. */
export const serializedPromotionSchema = promotionObjectSchema.extend({
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createPromotionSchema = promotionObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePromotionSchema = promotionObjectSchema
  .partial()
  .required({ id: true });

export type Promotion = z.infer<typeof promotionSchema>;
export type SerializedPromotion = z.infer<typeof serializedPromotionSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
