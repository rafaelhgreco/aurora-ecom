/**
 * Hook: useSectionCRUD
 *
 * Gerencia as operações CRUD de seções do catálogo. Lista via TanStack Query
 * (mesma query key de `useSections`, cache compartilhado com a loja e o
 * formulário de produto) e invalida o cache após cada mutação — sem reload
 * manual.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  createSectionAction,
  deleteSectionAction,
  updateSectionAction,
} from "@/app/actions/sections";
import { useSections } from "@/app/hooks/use-sections";
import type {
  CreateSectionInput,
  UpdateSectionInput,
} from "@/app/types/section";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";

const SECTIONS_QUERY_KEY = ["sections"];

export function useSectionCRUD() {
  const queryClient = useQueryClient();
  const {
    sections,
    loading: isQueryLoading,
    error: queryError,
    refetch,
  } = useSections();
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: SECTIONS_QUERY_KEY }),
    [queryClient],
  );

  const createSection = useCallback(
    async (data: CreateSectionInput) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await createSectionAction(data);
        if (result.success && result.data) {
          await invalidate();
          return { success: true, data: result.data };
        }
        const errorMsg = !result.success ? result.error : "Erro ao criar seção";
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

  const updateSection = useCallback(
    async (data: UpdateSectionInput) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await updateSectionAction(data);
        if (!result.success) {
          const errMsg = result.error || "Erro ao atualizar seção";
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

  const deleteSection = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const result = await deleteSectionAction(id);
        if (result.success) {
          await invalidate();
          return { success: true };
        }
        setMutationError(result.error || "Erro ao deletar seção");
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
    sections,
    isLoading: isQueryLoading || isMutating,
    error: mutationError ?? queryError,
    loadSections: refetch,
    createSection,
    updateSection,
    deleteSection,
  };
}
