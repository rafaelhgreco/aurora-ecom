"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  buildFilterQuery,
  parseFilterParams,
  type ShopFilterState,
} from "@/shared/shop-filter-helpers";

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

/**
 * Filtros da loja (subcategoria, tamanho e página) mantidos na URL, para que
 * qualquer combinação possa ser compartilhada por link. A URL é a única fonte
 * de verdade; mudanças usam `replace` para não poluir o histórico.
 */
export function useShopFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const state = useMemo(
    () => parseFilterParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const selectedSectionIds = useMemo(
    () => new Set(state.sectionIds),
    [state.sectionIds],
  );
  const selectedCategoryNames = useMemo(
    () => new Set(state.categoryNames),
    [state.categoryNames],
  );
  const selectedSizeKeys = useMemo(
    () => new Set(state.sizeKeys),
    [state.sizeKeys],
  );

  const update = useCallback(
    (next: ShopFilterState) => {
      const query = buildFilterQuery(next);
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  const toggleCategory = useCallback(
    (name: string) =>
      update({
        ...state,
        categoryNames: toggleValue(state.categoryNames, name),
        page: 1,
      }),
    [state, update],
  );

  const toggleSize = useCallback(
    (key: string) =>
      update({
        ...state,
        sizeKeys: toggleValue(state.sizeKeys, key),
        page: 1,
      }),
    [state, update],
  );

  const clearFilters = useCallback(
    () => update({ ...state, categoryNames: [], sizeKeys: [], page: 1 }),
    [state, update],
  );

  const toggleSection = useCallback(
    (id: string) =>
      update({
        ...state,
        sectionIds: toggleValue(state.sectionIds, id),
        page: 1,
      }),
    [state, update],
  );

  /**
   * Aplica vários campos numa única navegação (evita corrida entre
   * `router.replace` sucessivos). Volta para a página 1 salvo se `page` vier no patch.
   */
  const applyFilters = useCallback(
    (patch: Partial<ShopFilterState>) =>
      update({ ...state, page: 1, ...patch }),
    [state, update],
  );

  const setPage = useCallback(
    (page: number) => update({ ...state, page }),
    [state, update],
  );

  return {
    page: state.page,
    sortDirection: state.sortDirection,
    selectedSectionIds,
    selectedCategoryNames,
    selectedSizeKeys,
    toggleCategory,
    toggleSize,
    clearFilters,
    toggleSection,
    applyFilters,
    setPage,
  };
}
