import type { Product, SerializedProduct } from "@/core/schemas/product.schema";
import { serializeTimestamps } from "@/shared/serialize-timestamps";

export function serializeProductForClient(product: Product): SerializedProduct {
  return serializeTimestamps(product);
}
