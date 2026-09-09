import type {
  Category,
  SerializedCategory,
} from "@/core/schemas/category.schema";
import { serializeTimestamps } from "@/shared/serialize-timestamps";

export function serializeCategoryForClient(
  category: Category,
): SerializedCategory {
  return serializeTimestamps(category);
}
