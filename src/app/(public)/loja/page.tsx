"use client";

import { Box, Button, Flex, Heading, HStack, VStack } from "@chakra-ui/react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FiFilter } from "react-icons/fi";
import { IoSwapVertical } from "react-icons/io5";
import { ProductGrid } from "@/app/components/public/product-grid";
import { ProductGridSkeleton } from "@/app/components/public/product-grid-skeleton";
import {
  SectionCategoryFilterDrawer,
  SectionCategoryFilterList,
  ShopCategoryBreadcrumb,
  ShopHomeHero,
  ShopPageShell,
} from "@/app/components/public/shop";
import { Pagination } from "@/app/components/shared/pagination";
import { EmptyState, ErrorState } from "@/app/components/states";
import { useCategories } from "@/app/hooks/use-categories";
import { useProducts } from "@/app/hooks/use-products";
import { useSections } from "@/app/hooks/use-sections";
import { useShopFilters } from "@/app/hooks/use-shop-filters";
import { toaster } from "@/components/ui/toaster";
import {
  getEffectiveShopCategory,
  groupProductsByShopSectionSorted,
} from "@/shared/shop-category-helpers";
import { buildSizeOptions, filterProducts } from "@/shared/shop-filter-helpers";

const PAGE_SIZE = 20;
/** Busca única do catálogo ativo — seção, subcategoria, tamanho e paginação são
 *  resolvidos no client para a contagem e as opções de tamanho serem corretas. */
const CATALOG_FETCH_LIMIT = 1000;

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Hub da loja: catálogo completo. No topo ficam as seções (multisseleção) e a
 * ordenação A-Z; subcategoria e tamanho ficam na coluna de filtros (mesmo layout
 * da página de seção). Produtos agrupados por seção (dinâmica, cadastrada pelo
 * admin) e ordenados A–Z em cada grupo. Todos os filtros ficam na URL para
 * poderem ser compartilhados.
 */
export default function LojaPage() {
  return (
    <Suspense
      fallback={
        <ShopPageShell>
          <ProductGridSkeleton embed />
        </ShopPageShell>
      }
    >
      <LojaHubContent />
    </Suspense>
  );
}

function LojaHubContent() {
  const {
    page,
    sortDirection,
    selectedSectionIds,
    selectedCategoryNames,
    selectedSizeKeys,
    toggleSize,
    applyFilters,
    setPage,
  } = useShopFilters();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const { sections, loading: sectionsLoading } = useSections();
  const { categories, loading: categoriesLoading } = useCategories();

  const {
    products: catalog,
    loading: productsLoading,
    error,
  } = useProducts({
    page: 1,
    limitCount: CATALOG_FETCH_LIMIT,
    status: "ACTIVE",
  });

  const loading = productsLoading || sectionsLoading || categoriesLoading;

  const breadcrumbRoutes = useMemo(
    () =>
      sections
        .filter((s): s is typeof s & { id: string } => !!s.id)
        .map((s) => ({ slug: s.slug, shopCategory: s.id, title: s.name })),
    [sections],
  );

  /**
   * Mesmo nome de subcategoria pode existir em seções distintas (ex.:
   * "Shampoo" cadastrado em duas seções) — tratamos como uma única
   * subcategoria lógica, mapeando o nome para o conjunto de seções que a
   * contêm.
   */
  const sectionIdsByCategoryName = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of categories) {
      const key = c.name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)?.add(c.sectionId);
    }
    return map;
  }, [categories]);

  /** Valores da URL que não existem mais (link antigo) são ignorados. */
  const activeSectionIds = useMemo(() => {
    const valid = new Set(sections.map((s) => s.id));
    return new Set([...selectedSectionIds].filter((id) => valid.has(id)));
  }, [sections, selectedSectionIds]);

  /** Produtos das seções filtradas (vazio = todas) — base das opções de subcategoria. */
  const productsInSections = useMemo(
    () =>
      activeSectionIds.size === 0
        ? catalog
        : catalog.filter((p) =>
            activeSectionIds.has(getEffectiveShopCategory(p)),
          ),
    [catalog, activeSectionIds],
  );

  /**
   * Subcategorias com produtos nas seções filtradas, sem duplicar por nome
   * (mesmo nome em seções distintas = uma opção), com contagem.
   */
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of productsInSections) {
      const key = p.category?.trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const seen = new Set<string>();
    const options: { name: string; count: number }[] = [];
    for (const c of categories) {
      const key = c.name.trim().toLowerCase();
      const count = counts.get(key) ?? 0;
      if (seen.has(key) || count === 0) continue;
      seen.add(key);
      options.push({ name: c.name, count });
    }
    return options.sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
    );
  }, [productsInSections, categories]);

  const activeCategoryNames = useMemo(
    () =>
      new Set(
        categoryOptions
          .filter((o) =>
            [...selectedCategoryNames].some((n) => sameName(n, o.name)),
          )
          .map((o) => o.name),
      ),
    [categoryOptions, selectedCategoryNames],
  );

  const handleToggleCategory = useCallback(
    (name: string) => {
      if (activeCategoryNames.has(name)) {
        applyFilters({
          categoryNames: [...activeCategoryNames].filter((n) => n !== name),
        });
        return;
      }

      /** Ao escolher uma subcategoria, soma ao filtro as seções que a contêm. */
      const sectionIds = sectionIdsByCategoryName.get(
        name.trim().toLowerCase(),
      );
      applyFilters({
        categoryNames: [...activeCategoryNames, name],
        sectionIds: [...new Set([...activeSectionIds, ...(sectionIds ?? [])])],
      });
    },
    [
      applyFilters,
      activeCategoryNames,
      activeSectionIds,
      sectionIdsByCategoryName,
    ],
  );

  /** Desmarcar uma seção descarta as subcategorias que deixaram de existir no filtro. */
  const handleToggleSection = useCallback(
    (id: string) => {
      const next = new Set(activeSectionIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      const keptCategories = [...activeCategoryNames].filter(
        (name) =>
          next.size === 0 ||
          categories.some(
            (c) => next.has(c.sectionId) && sameName(c.name, name),
          ),
      );
      applyFilters({ sectionIds: [...next], categoryNames: keptCategories });
    },
    [activeSectionIds, activeCategoryNames, categories, applyFilters],
  );

  const clearSections = useCallback(
    () => applyFilters({ sectionIds: [], categoryNames: [] }),
    [applyFilters],
  );

  const toggleSortDirection = useCallback(() => {
    applyFilters({
      sortDirection: sortDirection === "asc" ? "desc" : "asc",
      page,
    });
  }, [applyFilters, sortDirection, page]);

  /** Produtos dentro de seção e subcategoria — base das opções de tamanho. */
  const scopedProducts = useMemo(() => {
    if (activeCategoryNames.size === 0) return productsInSections;
    return productsInSections.filter((p) =>
      [...activeCategoryNames].some((name) => sameName(p.category ?? "", name)),
    );
  }, [productsInSections, activeCategoryNames]);

  const sizeOptions = useMemo(
    () => buildSizeOptions(scopedProducts),
    [scopedProducts],
  );

  const activeSizeKeys = useMemo(() => {
    const valid = new Set(sizeOptions.map((o) => o.key));
    return new Set([...selectedSizeKeys].filter((k) => valid.has(k)));
  }, [sizeOptions, selectedSizeKeys]);

  const filteredProducts = useMemo(
    () =>
      filterProducts(scopedProducts, {
        categoryNames: new Set<string>(),
        sizeKeys: activeSizeKeys,
      }),
    [scopedProducts, activeSizeKeys],
  );

  /** "Limpar filtros": remove tudo — seções, subcategorias e tamanhos. */
  const clearAllFilters = useCallback(
    () => applyFilters({ sectionIds: [], categoryNames: [], sizeKeys: [] }),
    [applyFilters],
  );

  const hasActiveFilter =
    activeCategoryNames.size > 0 ||
    activeSectionIds.size > 0 ||
    activeSizeKeys.size > 0;

  const totalCount = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Só depois de carregar: com a lista vazia, totalPages = 1 e um link
  // compartilhado com ?pagina=2 seria descartado antes de os produtos chegarem.
  useEffect(() => {
    if (!loading && page > totalPages) setPage(1);
  }, [loading, page, totalPages, setPage]);

  const pageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  /**
   * Filtro sem nenhum produto (ou erro ao buscar com filtro ativo): avisa e
   * volta para "Todos" em vez de deixar o usuário preso numa tela vazia ou
   * de erro. Sem filtro ativo, um erro real continua caindo no ErrorState
   * com "Tentar novamente", já que resetar não mudaria nada.
   */
  useEffect(() => {
    if (loading || !hasActiveFilter) return;
    if (error || catalog.length === 0 || filteredProducts.length === 0) {
      toaster.create({
        title: "Nenhum produto encontrado",
        description:
          "Não há produtos para esse filtro no momento. Mostrando todos os produtos disponíveis.",
        type: "warning",
        duration: 4000,
      });
      applyFilters({ sectionIds: [], categoryNames: [], sizeKeys: [] });
    }
  }, [
    loading,
    error,
    hasActiveFilter,
    catalog.length,
    filteredProducts.length,
    applyFilters,
  ]);

  const groupedSections = useMemo(
    () =>
      groupProductsByShopSectionSorted(pageProducts, sections, sortDirection),
    [pageProducts, sections, sortDirection],
  );

  const hasSidebarFilters =
    categoryOptions.length > 0 || sizeOptions.length > 0;
  const activeSidebarFilterCount =
    activeCategoryNames.size + activeSizeKeys.size;

  return (
    <ShopPageShell>
      <VStack align="stretch" gap={{ base: 8, md: 10 }} w="full">
        <ShopHomeHero>
          <VStack align="stretch" gap={4} w="full">
            <ShopCategoryBreadcrumb
              routes={breadcrumbRoutes}
              selectedIds={activeSectionIds}
              onToggle={handleToggleSection}
              onClearAll={clearSections}
            />

            <HStack gap={3} flexWrap="wrap">
              {hasSidebarFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  display={{ base: "inline-flex", md: "none" }}
                  onClick={() => setIsFilterDrawerOpen(true)}
                >
                  <FiFilter style={{ marginRight: 6 }} />
                  Filtros
                  {activeSidebarFilterCount > 0
                    ? ` (${activeSidebarFilterCount})`
                    : ""}
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={toggleSortDirection}>
                <IoSwapVertical style={{ marginRight: 6 }} />
                {sortDirection === "asc" ? "A → Z" : "Z → A"}
              </Button>
            </HStack>
          </VStack>
        </ShopHomeHero>

        <Flex align="flex-start" gap={8} w="full">
          {hasSidebarFilters && (
            <Box
              display={{ base: "none", md: "block" }}
              w="240px"
              flexShrink={0}
            >
              <SectionCategoryFilterList
                categoryOptions={categoryOptions}
                selectedCategories={activeCategoryNames}
                onToggleCategory={handleToggleCategory}
                sizeOptions={sizeOptions}
                selectedSizes={activeSizeKeys}
                onToggleSize={toggleSize}
                onClear={clearAllFilters}
                hasExternalSelection={activeSectionIds.size > 0}
              />
            </Box>
          )}

          <VStack align="stretch" gap={8} flex={1} minW={0}>
            {loading && <ProductGridSkeleton embed />}

            {!loading && error && (
              <ErrorState
                title="Erro ao carregar produtos"
                message={error}
                onRetry={() => window.location.reload()}
              />
            )}

            {!loading && !error && catalog.length === 0 && (
              <EmptyState
                title="Nenhum produto na loja"
                description="Cadastre produtos no painel admin ou volte mais tarde."
              />
            )}

            {!loading &&
              !error &&
              catalog.length > 0 &&
              filteredProducts.length === 0 && (
                <EmptyState
                  title="Nenhum produto nesta combinação"
                  description="Ajuste os filtros selecionados ou limpe-os para ver o catálogo completo."
                />
              )}

            {!loading && !error && groupedSections.length > 0 && (
              <VStack align="stretch" gap={{ base: 10, md: 12 }} w="full">
                {groupedSections.map((section) => (
                  <VStack
                    key={section.shopCategory}
                    align="stretch"
                    gap={4}
                    w="full"
                  >
                    <Heading
                      as="h2"
                      size={{ base: "md", md: "lg" }}
                      color="gray.900"
                      fontWeight="semibold"
                    >
                      {section.sectionTitle}
                    </Heading>
                    <ProductGrid products={section.products} embed />
                  </VStack>
                ))}

                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    mt={8}
                  />
                )}
              </VStack>
            )}
          </VStack>
        </Flex>
      </VStack>

      <SectionCategoryFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        categoryOptions={categoryOptions}
        selectedCategories={activeCategoryNames}
        onToggleCategory={handleToggleCategory}
        sizeOptions={sizeOptions}
        selectedSizes={activeSizeKeys}
        onToggleSize={toggleSize}
        onClear={clearAllFilters}
        hasExternalSelection={activeSectionIds.size > 0}
      />
    </ShopPageShell>
  );
}
