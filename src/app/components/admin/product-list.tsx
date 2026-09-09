/**
 * Componente: Product List
 *
 * Lista de produtos: tabela em telas md+, cards empilhados abaixo disso
 * (ver ProductTable/ProductCard — o breakpoint decide via CSS `display`).
 */

"use client";

import { Box, Button, Heading, HStack, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoAdd, IoCloudUpload } from "react-icons/io5";
import type { Product } from "@/app/types/product";
import { EmptyState } from "../states/empty-state";
import { LoadingState } from "../states/loading-state";
import { ProductCard } from "./product-card";
import { ProductTable } from "./product-table";

interface ProductListProps {
  products: Product[];
  isLoading?: boolean;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onAdd?: () => void;
  onInventoryChange?: () => void;
}

export function ProductList({
  products,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onAdd,
  onInventoryChange,
}: ProductListProps) {
  const router = useRouter();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
        <Heading size="xl">Produtos</Heading>

        <HStack gap={3}>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/importacao")}
          >
            <IoCloudUpload style={{ marginRight: "8px" }} />
            Importar em massa
          </Button>

          {onAdd && (
            <Button colorScheme="blue" onClick={onAdd}>
              <IoAdd style={{ marginRight: "8px" }} />
              Novo Produto
            </Button>
          )}
        </HStack>
      </HStack>

      {products.length === 0 && (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Cadastre seu primeiro produto para começar"
          actionText={onAdd ? "Cadastrar Produto" : undefined}
          onAction={onAdd}
        />
      )}

      {products.length > 0 && (
        <>
          <ProductTable
            products={products}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onInventoryChange={onInventoryChange}
          />

          <VStack
            align="stretch"
            gap={4}
            display={{ base: "flex", md: "none" }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onInventoryChange={onInventoryChange}
              />
            ))}
          </VStack>
        </>
      )}
    </Box>
  );
}
