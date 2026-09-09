"use client";

import {
  Box,
  Button,
  createListCollection,
  Heading,
  HStack,
  Portal,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IoChevronBack,
  IoChevronForward,
  IoSwapVertical,
} from "react-icons/io5";
import { ProductGrid } from "@/app/components/public/product-grid";
import { ProductGridSkeleton } from "@/app/components/public/product-grid-skeleton";
import {
  ShopCategoryBreadcrumb,
  ShopHomeHero,
  ShopPageShell,
} from "@/app/components/public/shop";
import { EmptyState, ErrorState } from "@/app/components/states";
import { useCategories } from "@/app/hooks/use-categories";
import { useProducts } from "@/app/hooks/use-products";
import { useSections } from "@/app/hooks/use-sections";
import { toaster } from "@/components/ui/toaster";
import {
  getEffectiveShopCategory,
  groupProductsByShopSectionSorted,
  type SortDirection,
} from "@/shared/shop-category-helpers";

const ALL_CATEGORIES_VALUE = "";

/**
 * Hub da loja: catálogo completo + filtro multisseleção por seção + filtro
 * simples por subcategoria e ordenação A-Z. Produtos agrupados por seção
 * (dinâmica, cadastrada pelo admin) e ordenados A–Z em cada grupo.
 */
export default function LojaPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES_VALUE);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [page, setPage] = useState(1);
  const limit = 20;

  const { sections } = useSections();
  const { categories } = useCategories();

  const { products, loading, error, totalPages } = useProducts({
    page,
    limitCount: limit,
    status: "ACTIVE",
    category: categoryFilter || undefined,
  });

  const breadcrumbRoutes = useMemo(
    () =>
      sections
        .filter((s): s is typeof s & { id: string } => !!s.id)
        .map((s) => ({ slug: s.slug, shopCategory: s.id, title: s.name })),
    [sections],
  );

  /** Subcategoria só mostra opções das seções filtradas (vazio = todas). */
  const availableCategories = useMemo(() => {
    if (selectedIds.size === 0) return categories;
    return categories.filter((c) => selectedIds.has(c.sectionId));
  }, [categories, selectedIds]);

  useEffect(() => {
    if (
      categoryFilter &&
      !availableCategories.some((c) => c.name === categoryFilter)
    ) {
      setCategoryFilter(ALL_CATEGORIES_VALUE);
    }
  }, [availableCategories, categoryFilter]);

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

  const handleCategoryFilterChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setPage(1);
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPage(1);
  }, []);

  const clearCategories = useCallback(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedIds.size === 0) return products;
    return products.filter((p) => selectedIds.has(getEffectiveShopCategory(p)));
  }, [products, selectedIds]);

  const hasActiveFilter =
    categoryFilter !== ALL_CATEGORIES_VALUE || selectedIds.size > 0;

  /**
   * Filtro sem nenhum produto (ou erro ao buscar com filtro ativo): avisa e
   * volta para "Todos" em vez de deixar o usuário preso numa tela vazia ou
   * de erro. Sem filtro ativo, um erro real continua caindo no ErrorState
   * com "Tentar novamente", já que resetar não mudaria nada.
   */
  useEffect(() => {
    if (loading || !hasActiveFilter) return;
    if (error || products.length === 0 || filteredProducts.length === 0) {
      toaster.create({
        title: "Nenhum produto encontrado",
        description:
          "Não há produtos para esse filtro no momento. Mostrando todos os produtos disponíveis.",
        type: "warning",
        duration: 4000,
      });
      setCategoryFilter(ALL_CATEGORIES_VALUE);
      setSelectedIds(new Set());
      setPage(1);
    }
  }, [
    loading,
    error,
    hasActiveFilter,
    products.length,
    filteredProducts.length,
  ]);

  const groupedSections = useMemo(
    () =>
      groupProductsByShopSectionSorted(
        filteredProducts,
        sections,
        sortDirection,
      ),
    [filteredProducts, sections, sortDirection],
  );

  return (
    <ShopPageShell>
      <VStack align="stretch" gap={{ base: 8, md: 10 }} w="full">
        <ShopHomeHero>
          <VStack align="stretch" gap={4} w="full">
            <ShopCategoryBreadcrumb
              routes={breadcrumbRoutes}
              selectedIds={selectedIds}
              onToggle={toggleCategory}
              onClearAll={clearCategories}
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

              <Button size="sm" variant="outline" onClick={toggleSortDirection}>
                <IoSwapVertical style={{ marginRight: 6 }} />
                {sortDirection === "asc" ? "A → Z" : "Z → A"}
              </Button>
            </HStack>
          </VStack>
        </ShopHomeHero>

        {loading && <ProductGridSkeleton embed />}

        {!loading && error && (
          <ErrorState
            title="Erro ao carregar produtos"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && products.length === 0 && (
          <EmptyState
            title="Nenhum produto na loja"
            description="Cadastre produtos no painel admin ou volte mais tarde."
          />
        )}

        {!loading &&
          !error &&
          products.length > 0 &&
          filteredProducts.length === 0 && (
            <EmptyState
              title="Nenhum produto nesta combinação"
              description="Ajuste as categorias selecionadas ou use Todos para ver o catálogo completo."
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

            {totalPages && totalPages > 1 && (
              <HStack justify="center" mt={8} gap={4}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <IoChevronBack /> Anterior
                </Button>

                <Text fontSize="sm" fontWeight="medium">
                  Página {page} de {totalPages}
                </Text>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima <IoChevronForward />
                </Button>
              </HStack>
            )}
          </VStack>
        )}
      </VStack>
    </ShopPageShell>
  );
}
