"use client";

import { useQuery } from "@tanstack/react-query";
import { listProductsAction } from "@/app/actions/products";
import type { ProductFilter } from "@/core/schemas/product.schema";
import { PUBLIC_GENERIC } from "@/shared/errors/client-error-messages";

export function useDraftProducts(filter?: Omit<ProductFilter, "status">) {
  const page = filter?.page || 1;
  const limitCount = filter?.limitCount || 20;

  const {
    data: result,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["admin-draft-products", page, limitCount],
    queryFn: async () => {
      const res = await listProductsAction({
        ...filter,
        status: "DRAFT",
        page,
        limitCount,
      });
      if (!res.success) {
        throw new Error(res.error || PUBLIC_GENERIC);
      }
      return res.data;
    },
  });

  const products = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limitCount));
  const error = queryError ? queryError.message : null;

  return { products, totalCount, totalPages, loading, error, refetch };
}
