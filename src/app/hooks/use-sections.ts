/**
 * Hook: useSections
 *
 * Lista as seções do catálogo cadastradas (sem filtro/paginação — coleção pequena).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listSectionsAction } from "@/app/actions/sections";
import { PUBLIC_GENERIC } from "@/shared/errors/client-error-messages";

export function useSections() {
  const {
    data: result,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await listSectionsAction();
      if (!res.success) {
        throw new Error(res.error || PUBLIC_GENERIC);
      }
      return res.data;
    },
  });

  const sections = result || [];
  const error = queryError ? queryError.message : null;

  return { sections, loading, error, refetch };
}
