import type { Category } from "@/core/schemas/category.schema";

export function serializeCategoryForClient(c: Category): Category {
  return {
    ...c,
    createdAt: c.createdAt
      ? new Date(c.createdAt as Date | string).toISOString()
      : undefined,
    updatedAt: c.updatedAt
      ? new Date(c.updatedAt as Date | string).toISOString()
      : undefined,
  } as Category;
}
