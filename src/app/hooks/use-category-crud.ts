/**
 * Hook: useCategoryCRUD
 *
 * Gerencia as operações CRUD de subcategorias. Lista via TanStack Query
 * (mesma query key de `useCategories`, cache compartilhado com a loja e o
 * formulário de produto) e invalida o cache após cada mutação — sem reload
 * manual.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/actions/categories";
import { useCategories } from "@/app/hooks/use-categories";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/app/types/category";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";

const CATEGORIES_QUERY_KEY = ["categories"];

export function useCategoryCRUD() {
  const queryClient = useQueryClient();
  const {
    categories,
    loading: isQueryLoading,
    error: queryError,
    refetch,
  } = useCategories();
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    [queryClient],
  );

  const createCategory = useCallback(
    async (data: CreateCategoryInput) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await createCategoryAction(data);
        if (result.success && result.data) {
          await invalidate();
          return { success: true, data: result.data };
        }
        const errorMsg = !result.success
          ? result.error
          : "Erro ao criar categoria";
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

  const updateCategory = useCallback(
    async (data: UpdateCategoryInput) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await updateCategoryAction(data);
        if (!result.success) {
          const errMsg = result.error || "Erro ao atualizar categoria";
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

  const deleteCategory = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await deleteCategoryAction(id);
        if (result.success) {
          await invalidate();
          return { success: true };
        }
        setMutationError(result.error || "Erro ao deletar categoria");
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
    categories,
    isLoading: isQueryLoading || isMutating,
    error: mutationError ?? queryError,
    loadCategories: refetch,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
