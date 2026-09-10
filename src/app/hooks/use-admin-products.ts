/**
 * Hook: useAdminProducts
 *
 * Mesma lógica de useProducts (cache + paginação via TanStack Query), mas
 * com queryKey isolada da loja pública — admin precisa ver produtos DRAFT.
 */

"use client";

import { useProducts } from "@/app/hooks/use-products";
import type { ProductFilter } from "@/core/schemas/product.schema";

export function useAdminProducts(filter?: ProductFilter) {
  return useProducts(filter, "admin-products");
}
