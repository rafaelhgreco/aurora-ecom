/**
 * Tipos de promoção alinhados ao schema Zod (fonte única).
 * `Promotion` aqui é o formato serializado retornado pelas Server Actions (datas em string).
 */

export type {
  CreatePromotionInput,
  SerializedPromotion as Promotion,
  UpdatePromotionInput,
} from "@/core/schemas/promotion.schema";
