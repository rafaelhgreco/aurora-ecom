"use client";

import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useCallback, useMemo, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { ProductGrid } from "@/app/components/public/product-grid";
import { ProductGridSkeleton } from "@/app/components/public/product-grid-skeleton";
import {
  ShopCategoryBreadcrumb,
  ShopHomeHero,
  ShopPageShell,
} from "@/app/components/public/shop";
import { EmptyState, ErrorState } from "@/app/components/states";
import { useProducts } from "@/app/hooks/use-products";
import {
  SHOP_CATALOG_ROUTES,
  type ShopCategoryId,
} from "@/core/catalog/shop-catalog";
import {
  getEffectiveShopCategory,
  groupProductsByShopSectionSorted,
} from "@/shared/shop-category-helpers";

/**
 * Hub da loja: catálogo completo + filtro multisseleção.
 * Produtos agrupados por seção (Roupas, Produtos Aurora, …) e ordenados A–Z em cada grupo.
 */
export default function LojaPage() {
  const [selectedIds, setSelectedIds] = useState<Set<ShopCategoryId>>(
    () => new Set(),
  );

  const [page, setPage] = useState(1);
  const limit = 20;

  const { products, loading, error, totalPages } = useProducts({
    page,
    limitCount: limit,
  });

  const toggleCategory = useCallback((id: ShopCategoryId) => {
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

  const groupedSections = useMemo(
    () => groupProductsByShopSectionSorted(filteredProducts),
    [filteredProducts],
  );

  return (
    <ShopPageShell>
      <VStack align="stretch" gap={{ base: 8, md: 10 }} w="full">
        <ShopHomeHero>
          <ShopCategoryBreadcrumb
            routes={SHOP_CATALOG_ROUTES}
            selectedIds={selectedIds}
            onToggle={toggleCategory}
            onClearAll={clearCategories}
          />
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
