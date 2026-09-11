/**
 * Hook personalizado para carregar produtos
 * Demonstra como integrar Server Actions em hooks reutilizáveis
 */

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listProductsAction } from "@/app/actions/products";
import type { ProductFilter } from "@/core/schemas/product.schema";
import { PUBLIC_GENERIC } from "@/shared/errors/client-error-messages";

export function useProducts(
  filter?: ProductFilter,
  queryKeyPrefix = "public-products",
) {
  const limitCount = filter?.limitCount || 20;

  const {
    data: result,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [queryKeyPrefix, filter],
    queryFn: async () => {
      const res = await listProductsAction(filter);
      if (!res.success) {
        throw new Error(res.error || PUBLIC_GENERIC);
      }
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const products = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limitCount));
  const error = queryError ? queryError.message : null;

  return { products, totalCount, totalPages, loading, error, refetch };
}
