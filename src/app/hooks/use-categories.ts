/**
 * Hook: useCategories
 *
 * Lista as categorias cadastradas (sem filtro/paginação — coleção pequena).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listCategoriesAction } from "@/app/actions/categories";
import { PUBLIC_GENERIC } from "@/shared/errors/client-error-messages";

export function useCategories() {
  const {
    data: result,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await listCategoriesAction();
      if (!res.success) {
        throw new Error(res.error || PUBLIC_GENERIC);
      }
      return res.data;
    },
  });

  const categories = result || [];
  const error = queryError ? queryError.message : null;

  return { categories, loading, error, refetch };
}
