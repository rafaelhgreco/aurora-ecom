/**
 * Hook: usePromotionCRUD
 *
 * Gerencia as operações CRUD de promoções. Lista via TanStack Query (mesma
 * query key de `usePromotions`) e invalida o cache após cada mutação.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  createPromotionAction,
  deletePromotionAction,
  updatePromotionAction,
} from "@/app/actions/promotions";
import {
  PROMOTIONS_QUERY_KEY,
  usePromotions,
} from "@/app/hooks/use-promotions";
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
} from "@/app/types/promotion";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";

export function usePromotionCRUD() {
  const queryClient = useQueryClient();
  const {
    promotions,
    loading: isQueryLoading,
    error: queryError,
    refetch,
  } = usePromotions();
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: PROMOTIONS_QUERY_KEY }),
    [queryClient],
  );

  const createPromotion = useCallback(
    async (data: CreatePromotionInput) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await createPromotionAction(data);
        if (result.success && result.data) {
          await invalidate();
          return { success: true, data: result.data };
        }
        const errorMsg = !result.success
          ? result.error
          : "Erro ao criar promoção";
        setMutationError(errorMsg);
        return { success: false, error: errorMsg };
      } catch {
        setMutationError(ADMIN_GENERIC);
        return { success: false, error: ADMIN_GENERIC };
      } finally {
        setIsMutating(false);
      }
    },
    [invalidate],
  );

  const updatePromotion = useCallback(
    async (data: UpdatePromotionInput) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await updatePromotionAction(data);
        if (!result.success) {
          const errMsg = result.error || "Erro ao atualizar promoção";
          setMutationError(errMsg);
          return { success: false, error: errMsg };
        }
        await invalidate();
        return { success: true, data: result.data };
      } catch {
        setMutationError(ADMIN_GENERIC);
        return { success: false, error: ADMIN_GENERIC };
      } finally {
        setIsMutating(false);
      }
    },
    [invalidate],
  );

  const deletePromotion = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await deletePromotionAction(id);
        if (result.success) {
          await invalidate();
          return { success: true };
        }
        setMutationError(result.error || "Erro ao deletar promoção");
        return { success: false, error: result.error };
      } catch {
        setMutationError(ADMIN_GENERIC);
        return { success: false, error: ADMIN_GENERIC };
      } finally {
        setIsMutating(false);
      }
    },
    [invalidate],
  );

  return {
    promotions,
    isLoading: isQueryLoading || isMutating,
    error: mutationError ?? queryError,
    loadPromotions: refetch,
    createPromotion,
    updatePromotion,
    deletePromotion,
  };
}
