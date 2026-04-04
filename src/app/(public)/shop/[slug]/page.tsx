"use client";

import { Heading, Text, VStack } from "@chakra-ui/react";
import { notFound, useParams } from "next/navigation";
import { ProductGrid } from "@/app/components/public/product-grid";
import { ProductGridSkeleton } from "@/app/components/public/product-grid-skeleton";
import { ShopPageShell } from "@/app/components/public/shop";
import { EmptyState, ErrorState } from "@/app/components/states";
import { useProducts } from "@/app/hooks/use-products";
import { getShopCatalogBySlug } from "@/core/catalog/shop-catalog";

/**
 * Catálogo filtrado por seção (Roupas / Produtos Aurora).
 */
export default function ShopCategoryPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const catalog = slug ? getShopCatalogBySlug(slug) : undefined;

  if (!catalog) {
    notFound();
  }

  const { products, loading, error } = useProducts({
    shopCategory: catalog.shopCategory,
  });

  return (
    <ShopPageShell>
      <VStack align="stretch" gap={8} w="full">
        <VStack align="stretch" gap={1}>
          <Heading as="h1" size={{ base: "lg", md: "xl" }} color="gray.900">
            {catalog.title}
          </Heading>
          <Text color="gray.600" fontSize="sm">
            {catalog.description}
          </Text>
        </VStack>

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
            title="Nenhum produto nesta categoria"
            description="Cadastre produtos com esta seção no painel admin ou volte mais tarde."
          />
        )}

        {!loading && !error && products.length > 0 && (
          <ProductGrid products={products} embed />
        )}
      </VStack>
    </ShopPageShell>
  );
}
