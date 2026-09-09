/**
 * Hook: useCategoryProductsBulkMove
 *
 * Lista os produtos de uma subcategoria (por nome), paginado, e expõe uma
 * mutação para mover/limpar em massa a subcategoria dos produtos
 * selecionados. Usado pelo painel "Gerenciar produtos" de uma subcategoria.
 */

"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  bulkUpdateProductsCategoryAction,
  listProductsAction,
} from "@/app/actions/products";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";

export const CATEGORY_PRODUCTS_PAGE_SIZE = 20;

export function useCategoryProductsBulkMove(
  categoryName: string,
  page: number,
  limitCount: number = CATEGORY_PRODUCTS_PAGE_SIZE,
) {
  const queryClient = useQueryClient();
  /** Sem `page` — invalida (e força refetch de) todas as páginas da
   * subcategoria de uma vez, já que mover produtos muda o total e desloca
   * quais produtos caem em qual página. */
  const categoryQueryKey = useMemo(
    () => ["category-products", categoryName],
    [categoryName],
  );
  const pageQueryKey = useMemo(
    () => [...categoryQueryKey, page, limitCount],
    [categoryQueryKey, page, limitCount],
  );

  const {
    data,
    isLoading,
    isPlaceholderData,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: pageQueryKey,
    enabled: !!categoryName,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await listProductsAction({
        category: categoryName,
        page,
        limitCount,
      });
      if (!res.success) {
        throw new Error(res.error || ADMIN_GENERIC);
      }
      return res.data;
    },
  });

  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const bulkMove = useCallback(
    async (productIds: string[], category: string) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await bulkUpdateProductsCategoryAction({
          productIds,
          category,
        });
        if (!result.success) {
          setMutationError(result.error || ADMIN_GENERIC);
          return { success: false as const, error: result.error };
        }
        await queryClient.invalidateQueries({ queryKey: categoryQueryKey });
        return { success: true as const, data: result.data };
      } catch {
        setMutationError(ADMIN_GENERIC);
        return { success: false as const, error: ADMIN_GENERIC };
      } finally {
        setIsMutating(false);
      }
    },
    [queryClient, categoryQueryKey],
  );

  return {
    products: data?.data ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    /** true enquanto mostra dados da página anterior (via keepPreviousData) até a nova página chegar */
    isFetchingNextPage: isPlaceholderData,
    isMutating,
    error: mutationError ?? (queryError ? queryError.message : null),
    bulkMove,
    refetch,
  };
}
