"use client";

import { Heading, Text, VStack } from "@chakra-ui/react";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductGrid } from "@/app/components/public/product-grid";
import { ProductGridSkeleton } from "@/app/components/public/product-grid-skeleton";
import { ShopPageShell } from "@/app/components/public/shop";
import { EmptyState, ErrorState } from "@/app/components/states";
import { useProducts } from "@/app/hooks/use-products";
import { useSections } from "@/app/hooks/use-sections";
import { sortProductsAlphabetically } from "@/shared/shop-category-helpers";

/**
 * Catálogo filtrado por seção (dinâmica, cadastrada pelo admin).
 * Produtos em ordem alfabética pelo título.
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
  const { products, loading, error, totalPages } = useProducts({
    shopCategory: section?.id,
    page,
    limitCount: 12,
    status: "ACTIVE",
  });

  const sortedProducts = useMemo(
    () => sortProductsAlphabetically(products),
    [products],
  );

  const isLoading = sectionsLoading || loading;

  return (
    <ShopPageShell>
      <VStack align="stretch" gap={8} w="full">
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

        {isLoading && <ProductGridSkeleton embed />}

        {!isLoading && error && (
          <ErrorState
            title="Erro ao carregar produtos"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {!isLoading && !error && products.length === 0 && (
          <EmptyState
            title="Nenhum produto nesta categoria"
            description="Cadastre produtos com esta seção no painel admin ou volte mais tarde."
          />
        )}

        {!isLoading && !error && sortedProducts.length > 0 && (
          <ProductGrid
            products={sortedProducts}
            embed
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </VStack>
    </ShopPageShell>
  );
}
