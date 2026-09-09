import type {
  Promotion,
  SerializedPromotion,
} from "@/core/schemas/promotion.schema";
import { serializeTimestamps } from "@/shared/serialize-timestamps";

export function serializePromotionForClient(
  promotion: Promotion,
): SerializedPromotion {
  return serializeTimestamps(promotion);
}
