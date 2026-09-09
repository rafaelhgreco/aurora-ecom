/**
 * Hook: usePromotionProductsBulkAssign
 *
 * Lista produtos para a tela "Gerenciar produtos" de uma promoção, paginado,
 * em dois escopos: `assigned` (só os já associados a esta promoção — mesmo
 * padrão de `useCategoryProductsBulkMove`) ou `all` (catálogo inteiro,
 * necessário para associar produtos a uma promoção recém-criada, que ainda
 * não tem nenhum produto vinculado). Expõe mutações para associar/remover em
 * massa e para definir o valor base (override) de um produto individual.
 */

"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { listProductsAction } from "@/app/actions/products";
import {
  bulkUpdateProductsPromotionAction,
  setProductPromotionOverridePriceAction,
} from "@/app/actions/promotions";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";

export const PROMOTION_PRODUCTS_PAGE_SIZE = 20;

export type PromotionProductsScope = "assigned" | "all";

export function usePromotionProductsBulkAssign(
  promotionId: string,
  scope: PromotionProductsScope,
  page: number,
  limitCount: number = PROMOTION_PRODUCTS_PAGE_SIZE,
) {
  const queryClient = useQueryClient();
  /** Sem `scope`/`page` — invalida todas as páginas/escopos desta promoção de
   * uma vez, já que (des)associar produtos muda o total de ambos os escopos. */
  const promotionQueryKey = useMemo(
    () => ["promotion-products", promotionId],
    [promotionId],
  );
  const pageQueryKey = useMemo(
    () => [...promotionQueryKey, scope, page, limitCount],
    [promotionQueryKey, scope, page, limitCount],
  );

  const {
    data,
    isLoading,
    isPlaceholderData,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: pageQueryKey,
    enabled: !!promotionId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await listProductsAction({
        ...(scope === "assigned" ? { promotionId } : {}),
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

  const bulkAssign = useCallback(
    async (productIds: string[], promotionIdOrNull: string | null) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await bulkUpdateProductsPromotionAction({
          productIds,
          promotionId: promotionIdOrNull,
        });
        if (!result.success) {
          setMutationError(result.error || ADMIN_GENERIC);
          return { success: false as const, error: result.error };
        }
        await queryClient.invalidateQueries({ queryKey: promotionQueryKey });
        return { success: true as const, data: result.data };
      } catch {
        setMutationError(ADMIN_GENERIC);
        return { success: false as const, error: ADMIN_GENERIC };
      } finally {
        setIsMutating(false);
      }
    },
    [queryClient, promotionQueryKey],
  );

  const setOverridePrice = useCallback(
    async (productId: string, overridePrice: number | null) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await setProductPromotionOverridePriceAction({
          productId,
          overridePrice,
        });
        if (!result.success) {
          setMutationError(result.error || ADMIN_GENERIC);
          return { success: false as const, error: result.error };
        }
        await queryClient.invalidateQueries({ queryKey: promotionQueryKey });
        return { success: true as const, data: result.data };
      } catch {
        setMutationError(ADMIN_GENERIC);
        return { success: false as const, error: ADMIN_GENERIC };
      } finally {
        setIsMutating(false);
      }
    },
    [queryClient, promotionQueryKey],
  );

  return {
    products: data?.data ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    /** true enquanto mostra dados da página anterior (via keepPreviousData) até a nova página chegar */
    isFetchingNextPage: isPlaceholderData,
    isMutating,
    error: mutationError ?? (queryError ? queryError.message : null),
    bulkAssign,
    setOverridePrice,
    refetch,
  };
}
