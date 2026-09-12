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
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { sortProductsAlphabetically } from "@/shared/shop-category-helpers";

const PAGE_SIZE = 12;
/** Busca única de todos os ativos da seção — filtro/paginação de subcategoria
 *  são resolvidos 100% no client para evitar contagem incorreta (ver hub /loja). */
const SECTION_FETCH_LIMIT = 1000;

/**
 * Catálogo filtrado por seção (dinâmica, cadastrada pelo admin), com filtro
 * opcional por subcategoria. Produtos em ordem alfabética pelo título.
 */
export default function LojaCategoryPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];

  const { sections, loading: sectionsLoading } = useSections();
  const section = slug ? sections.find((s) => s.slug === slug) : undefined;

  if (!sectionsLoading && !section) {
    notFound();
  }

  const [page, setPage] = useState(1);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<
    Set<string>
  >(() => new Set());
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

  const toggleCategory = useCallback((name: string) => {
    setSelectedCategoryNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
    setPage(1);
  }, []);

  const clearCategoryFilters = useCallback(() => {
    setSelectedCategoryNames(new Set());
    setPage(1);
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryNames.size === 0) return products;
    return products.filter(
      (p) => p.category && selectedCategoryNames.has(p.category),
    );
  }, [products, selectedCategoryNames]);

  const sortedFilteredProducts = useMemo(
    () => sortProductsAlphabetically(filteredProducts),
    [filteredProducts],
  );

  const totalCount = sortedFilteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedFilteredProducts.slice(start, start + PAGE_SIZE);
  }, [sortedFilteredProducts, page]);

  const isLoading = sectionsLoading || loading;
  const hasFilters = categoryOptions.length > 0;

  return (
    <ShopPageShell>
      <Flex align="flex-start" gap={8} w="full">
        {hasFilters && (
          <Box display={{ base: "none", md: "block" }} w="240px" flexShrink={0}>
            <SectionCategoryFilterList
              options={categoryOptions}
              selected={selectedCategoryNames}
              onToggle={toggleCategory}
              onClear={clearCategoryFilters}
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
                    {selectedCategoryNames.size > 0
                      ? ` (${selectedCategoryNames.size})`
                      : ""}
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
        options={categoryOptions}
        selected={selectedCategoryNames}
        onToggle={toggleCategory}
        onClear={clearCategoryFilters}
      />
    </ShopPageShell>
  );
}
