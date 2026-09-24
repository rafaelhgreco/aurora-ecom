"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { notFound, useParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FiFilter } from "react-icons/fi";
import { ProductGrid } from "@/app/components/public/product-grid";
import { ProductGridSkeleton } from "@/app/components/public/product-grid-skeleton";
import {
  SectionCategoryFilterDrawer,
  SectionCategoryFilterList,
  ShopPageShell,
} from "@/app/components/public/shop";
import { EmptyState, ErrorState } from "@/app/components/states";
import { useProducts } from "@/app/hooks/use-products";
import { useSections } from "@/app/hooks/use-sections";
import { useShopFilters } from "@/app/hooks/use-shop-filters";
import { sortProductsAlphabetically } from "@/shared/shop-category-helpers";
import { buildSizeOptions, filterProducts } from "@/shared/shop-filter-helpers";

const PAGE_SIZE = 12;
/** Busca única de todos os ativos da seção — filtro/paginação de subcategoria
 *  são resolvidos 100% no client para evitar contagem incorreta (ver hub /loja). */
const SECTION_FETCH_LIMIT = 1000;

/**
 * Catálogo filtrado por seção (dinâmica, cadastrada pelo admin), com filtros
 * opcionais por subcategoria e tamanho, mantidos na URL para compartilhamento.
 * Produtos em ordem alfabética pelo título.
 */
export default function LojaCategoryPage() {
  return (
    <Suspense
      fallback={
        <ShopPageShell>
          <ProductGridSkeleton embed />
        </ShopPageShell>
      }
    >
      <LojaCategoryContent />
    </Suspense>
  );
}

function LojaCategoryContent() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];

  const { sections, loading: sectionsLoading } = useSections();
  const section = slug ? sections.find((s) => s.slug === slug) : undefined;

  if (!sectionsLoading && !section) {
    notFound();
  }

  const {
    page,
    selectedCategoryNames,
    selectedSizeKeys,
    toggleCategory,
    toggleSize,
    clearFilters,
    setPage,
  } = useShopFilters();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const { products, loading, error } = useProducts({
    shopCategory: section?.id,
    status: "ACTIVE",
    limitCount: SECTION_FETCH_LIMIT,
    page: 1,
  });

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const name = p.category?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      );
  }, [products]);

  const sizeOptions = useMemo(() => buildSizeOptions(products), [products]);

  // Valores da URL que não existem na seção (link antigo) são ignorados.
  const activeCategoryNames = useMemo(() => {
    const valid = new Set(categoryOptions.map((o) => o.name));
    return new Set([...selectedCategoryNames].filter((n) => valid.has(n)));
  }, [categoryOptions, selectedCategoryNames]);

  const activeSizeKeys = useMemo(() => {
    const valid = new Set(sizeOptions.map((o) => o.key));
    return new Set([...selectedSizeKeys].filter((k) => valid.has(k)));
  }, [sizeOptions, selectedSizeKeys]);

  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        categoryNames: activeCategoryNames,
        sizeKeys: activeSizeKeys,
      }),
    [products, activeCategoryNames, activeSizeKeys],
  );

  const sortedFilteredProducts = useMemo(
    () => sortProductsAlphabetically(filteredProducts),
    [filteredProducts],
  );

  const totalCount = sortedFilteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const isLoading = sectionsLoading || loading;

  // Só depois de carregar: com a lista vazia, totalPages = 1 e um link
  // compartilhado com ?pagina=2 seria descartado antes de os produtos chegarem.
  useEffect(() => {
    if (!isLoading && page > totalPages) setPage(1);
  }, [isLoading, totalPages, page, setPage]);

  const pageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedFilteredProducts.slice(start, start + PAGE_SIZE);
  }, [sortedFilteredProducts, page]);

  const hasFilters = categoryOptions.length > 0 || sizeOptions.length > 0;
  const activeFilterCount = activeCategoryNames.size + activeSizeKeys.size;

  return (
    <ShopPageShell>
      <Flex align="flex-start" gap={8} w="full">
        {hasFilters && (
          <Box display={{ base: "none", md: "block" }} w="240px" flexShrink={0}>
            <SectionCategoryFilterList
              categoryOptions={categoryOptions}
              selectedCategories={activeCategoryNames}
              onToggleCategory={toggleCategory}
              sizeOptions={sizeOptions}
              selectedSizes={activeSizeKeys}
              onToggleSize={toggleSize}
              onClear={clearFilters}
            />
          </Box>
        )}

        <VStack align="stretch" gap={8} flex={1} minW={0}>
          {section && (
            <VStack align="stretch" gap={1}>
              <Heading as="h1" size={{ base: "lg", md: "xl" }} color="gray.900">
                {section.name}
              </Heading>
              {section.description && (
                <Text color="gray.600" fontSize="sm">
                  {section.description}
                </Text>
              )}
            </VStack>
          )}

          {hasFilters && (
            <HStack display={{ base: "flex", md: "none" }}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFilterDrawerOpen(true)}
              >
                <HStack gap={2}>
                  <FiFilter />
                  <Text>
                    Filtros
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </Text>
                </HStack>
              </Button>
            </HStack>
          )}

          {isLoading && <ProductGridSkeleton embed />}

          {!isLoading && error && (
            <ErrorState
              title="Erro ao carregar produtos"
              message={error}
              onRetry={() => window.location.reload()}
            />
          )}

          {!isLoading && !error && sortedFilteredProducts.length === 0 && (
            <EmptyState
              title="Nenhum produto nesta categoria"
              description="Cadastre produtos com esta seção no painel admin ou volte mais tarde."
            />
          )}

          {!isLoading && !error && sortedFilteredProducts.length > 0 && (
            <ProductGrid
              products={pageProducts}
              embed
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalCount={totalCount}
              limitCount={PAGE_SIZE}
            />
          )}
        </VStack>
      </Flex>

      <SectionCategoryFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        categoryOptions={categoryOptions}
        selectedCategories={activeCategoryNames}
        onToggleCategory={toggleCategory}
        sizeOptions={sizeOptions}
        selectedSizes={activeSizeKeys}
        onToggleSize={toggleSize}
        onClear={clearFilters}
      />
    </ShopPageShell>
  );
}
