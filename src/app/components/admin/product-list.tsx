/**
 * Componente: Product List
 *
 * Lista de produtos com alternância entre grid e tabela
 */

"use client";

import {
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoAdd, IoCloudUpload, IoGrid, IoList } from "react-icons/io5";
import type { Product, ViewMode } from "@/app/types/product";
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
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Box>
      {/* Header com controles */}
      <HStack justify="space-between" mb={6}>
        <Heading size="xl">Produtos</Heading>

        <HStack gap={3}>
          {/* Toggle de visualização */}
          <HStack gap={1} bg="gray.100" borderRadius="md" p={1}>
            <IconButton
              aria-label="Visualização em grade"
              size="sm"
              variant={viewMode === "grid" ? "solid" : "ghost"}
              onClick={() => setViewMode("grid")}
            >
              <IoGrid />
            </IconButton>
            <IconButton
              aria-label="Visualização em tabela"
              size="sm"
              variant={viewMode === "table" ? "solid" : "ghost"}
              onClick={() => setViewMode("table")}
            >
              <IoList />
            </IconButton>
          </HStack>

          <Button
            variant="outline"
            onClick={() => router.push("/admin-produtos/importacao")}
          >
            <IoCloudUpload style={{ marginRight: "8px" }} />
            Importar em massa
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/admin-produtos/pendentes")}
          >
            Pendentes
          </Button>

          <Button
            variant="outline"
            colorScheme="green"
            onClick={() => router.push("/admin-produtos/scan")}
          >
            Escanear
          </Button>

          {onAdd && (
            <Button colorScheme="blue" onClick={onAdd}>
              <IoAdd style={{ marginRight: "8px" }} />
              Novo Produto
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Lista vazia */}
      {products.length === 0 && (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Cadastre seu primeiro produto para começar"
          actionText={onAdd ? "Cadastrar Produto" : undefined}
          onAction={onAdd}
        />
      )}

      {/* Grid View */}
      {viewMode === "grid" && products.length > 0 && (
        <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Grid>
      )}

      {/* Table View */}
      {viewMode === "table" && products.length > 0 && (
        <ProductTable
          products={products}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onInventoryChange={onInventoryChange}
        />
      )}
    </Box>
  );
}
