/**
 * Hook: usePromotions
 *
 * Lista as promoções cadastradas (sem filtro/paginação — coleção pequena).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listPromotionsAction } from "@/app/actions/promotions";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";

export const PROMOTIONS_QUERY_KEY = ["promotions"];

export function usePromotions() {
  const {
    data: result,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: PROMOTIONS_QUERY_KEY,
    queryFn: async () => {
      const res = await listPromotionsAction();
      if (!res.success) {
        throw new Error(res.error || ADMIN_GENERIC);
      }
      return res.data;
    },
  });

  const promotions = result || [];
  const error = queryError ? queryError.message : null;

  return { promotions, loading, error, refetch };
}
