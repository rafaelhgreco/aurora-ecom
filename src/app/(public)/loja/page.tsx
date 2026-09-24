"use client";

import {
  Box,
  Button,
  createListCollection,
  Flex,
  Heading,
  HStack,
  Portal,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  VStack,
} from "@chakra-ui/react";
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

const ALL_CATEGORIES_VALUE = "";
const PAGE_SIZE = 20;
/** Busca única do catálogo ativo — seção, subcategoria, tamanho e paginação são
 *  resolvidos no client para a contagem e as opções de tamanho serem corretas. */
const CATALOG_FETCH_LIMIT = 1000;

const EMPTY_SET: ReadonlySet<string> = new Set();

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Hub da loja: catálogo completo + filtro multisseleção por seção + filtro
 * simples por subcategoria, filtro por tamanho e ordenação A-Z. Produtos
 * agrupados por seção (dinâmica, cadastrada pelo admin) e ordenados A–Z em cada
 * grupo. Todos os filtros ficam na URL para poderem ser compartilhados.
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
    toggleSection,
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

  /** Subcategoria só mostra opções das seções filtradas (vazio = todas), sem duplicar por nome. */
  const availableCategories = useMemo(() => {
    const list =
      activeSectionIds.size === 0
        ? categories
        : categories.filter((c) => activeSectionIds.has(c.sectionId));

    const seen = new Set<string>();
    return list.filter((c) => {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories, activeSectionIds]);

  const categoryFilter = useMemo(() => {
    const [name] = [...selectedCategoryNames];
    if (!name) return ALL_CATEGORIES_VALUE;
    return availableCategories.some((c) => sameName(c.name, name))
      ? name
      : ALL_CATEGORIES_VALUE;
  }, [selectedCategoryNames, availableCategories]);

  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Todas as subcategorias", value: ALL_CATEGORIES_VALUE },
          ...availableCategories.map((c) => ({ label: c.name, value: c.name })),
        ],
      }),
    [availableCategories],
  );

  const handleCategoryFilterChange = useCallback(
    (value: string) => {
      if (!value) {
        applyFilters({ categoryNames: [] });
        return;
      }

      /** Ao escolher uma subcategoria, soma ao filtro as seções que a contêm. */
      const sectionIds = sectionIdsByCategoryName.get(
        value.trim().toLowerCase(),
      );
      applyFilters({
        categoryNames: [value],
        sectionIds: [...new Set([...activeSectionIds, ...(sectionIds ?? [])])],
      });
    },
    [applyFilters, sectionIdsByCategoryName, activeSectionIds],
  );

  /** Desmarcar uma seção descarta a subcategoria que deixou de existir no filtro. */
  const handleToggleSection = useCallback(
    (id: string) => {
      const next = new Set(activeSectionIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      const categoryStillValid =
        !categoryFilter ||
        next.size === 0 ||
        categories.some(
          (c) => next.has(c.sectionId) && sameName(c.name, categoryFilter),
        );

      if (categoryStillValid) {
        toggleSection(id);
      } else {
        applyFilters({ sectionIds: [...next], categoryNames: [] });
      }
    },
    [activeSectionIds, categories, categoryFilter, toggleSection, applyFilters],
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
  const scopedProducts = useMemo(
    () =>
      catalog.filter((p) => {
        if (
          activeSectionIds.size > 0 &&
          !activeSectionIds.has(getEffectiveShopCategory(p))
        ) {
          return false;
        }
        return !categoryFilter || sameName(p.category ?? "", categoryFilter);
      }),
    [catalog, activeSectionIds, categoryFilter],
  );

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
        categoryNames: EMPTY_SET as Set<string>,
        sizeKeys: activeSizeKeys,
      }),
    [scopedProducts, activeSizeKeys],
  );

  const clearSizes = useCallback(
    () => applyFilters({ sizeKeys: [] }),
    [applyFilters],
  );

  const hasActiveFilter =
    categoryFilter !== ALL_CATEGORIES_VALUE ||
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

  const hasSizeFilter = sizeOptions.length > 0;

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
              <Box minW="200px">
                <SelectRoot
                  collection={categoryCollection}
                  value={[categoryFilter]}
                  onValueChange={(details) =>
                    handleCategoryFilterChange(
                      details.value[0] ?? ALL_CATEGORIES_VALUE,
                    )
                  }
                  size="sm"
                >
                  <SelectTrigger>
                    <SelectValueText placeholder="Tipo de produto" />
                  </SelectTrigger>
                  <Portal>
                    <SelectPositioner>
                      <SelectContent>
                        {categoryCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectPositioner>
                  </Portal>
                </SelectRoot>
              </Box>

              {hasSizeFilter && (
                <Button
                  size="sm"
                  variant="outline"
                  display={{ base: "inline-flex", md: "none" }}
                  onClick={() => setIsFilterDrawerOpen(true)}
                >
                  <FiFilter style={{ marginRight: 6 }} />
                  Tamanhos
                  {activeSizeKeys.size > 0 ? ` (${activeSizeKeys.size})` : ""}
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
          {hasSizeFilter && (
            <Box
              display={{ base: "none", md: "block" }}
              w="240px"
              flexShrink={0}
            >
              <SectionCategoryFilterList
                categoryOptions={[]}
                selectedCategories={EMPTY_SET as Set<string>}
                onToggleCategory={() => undefined}
                sizeOptions={sizeOptions}
                selectedSizes={activeSizeKeys}
                onToggleSize={toggleSize}
                onClear={clearSizes}
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
        categoryOptions={[]}
        selectedCategories={EMPTY_SET as Set<string>}
        onToggleCategory={() => undefined}
        sizeOptions={sizeOptions}
        selectedSizes={activeSizeKeys}
        onToggleSize={toggleSize}
        onClear={clearSizes}
      />
    </ShopPageShell>
  );
}
