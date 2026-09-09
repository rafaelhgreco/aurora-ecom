/**
 * Componente: Product Table
 *
 * Tabela de produtos com ações (ver, editar, deletar). Visível apenas em
 * telas md+ — abaixo disso a lista renderiza ProductCard (ver product-list.tsx).
 */

"use client";

import {
  Badge,
  Button,
  HStack,
  IconButton,
  Image,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IoEye,
  IoPauseCircle,
  IoPencil,
  IoPlayCircle,
  IoRemoveOutline,
  IoTrash,
} from "react-icons/io5";
import { useProductQuickActions } from "@/app/hooks/use-product-quick-actions";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";
import { getTotalStock } from "@/shared/product-stock-helpers";
import { PauseProductDialog } from "./pause-product-dialog";

interface ProductTableProps {
  products: Product[];
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  /** Recarregar lista após ações rápidas (estoque / vitrine) */
  onInventoryChange?: () => void;
}

export function ProductTable({
  products,
  onView,
  onEdit,
  onDelete,
  onInventoryChange,
}: ProductTableProps) {
  const {
    busyId,
    pauseConfirmProduct,
    setPauseConfirmProduct,
    showStockTools,
    showSoftDeactivate,
    showQuickActions,
    handleStockMinus,
    handleToggleActive,
    handleConfirmPause,
  } = useProductQuickActions(onInventoryChange);

  if (products.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        Nenhum produto encontrado
      </Text>
    );
  }

  return (
    <>
      <Table.Root
        variant="outline"
        size="md"
        display={{ base: "none", md: "table" }}
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Imagem</Table.ColumnHeader>
            <Table.ColumnHeader>Produto</Table.ColumnHeader>
            <Table.ColumnHeader>Categoria</Table.ColumnHeader>
            <Table.ColumnHeader>Preço</Table.ColumnHeader>
            <Table.ColumnHeader>Estoque</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            {showQuickActions && (
              <Table.ColumnHeader textAlign="center">Rápido</Table.ColumnHeader>
            )}
            <Table.ColumnHeader textAlign="center">Ações</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map((product) => (
            <Table.Row key={product.id}>
              <Table.Cell>
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  boxSize="50px"
                  objectFit="cover"
                  borderRadius="md"
                />
              </Table.Cell>
              <Table.Cell>
                <Text fontWeight="medium">{product.title}</Text>
                {product.subtitle && (
                  <Text fontSize="sm" color="gray.500">
                    {product.subtitle}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Text>{product.category || "-"}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text fontWeight="medium">{formatPrice(product.price)}</Text>
              </Table.Cell>
              <Table.Cell>
                <Badge
                  colorScheme={getTotalStock(product) > 0 ? "green" : "red"}
                >
                  {getTotalStock(product)} un.
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={product.isActive ? "green" : "gray"}>
                  {product.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </Table.Cell>
              {showQuickActions && (
                <Table.Cell>
                  <VStack gap={2} align="center">
                    {showStockTools &&
                      !(product.stockBySize && product.sizes?.length) && (
                        <IconButton
                          type="button"
                          aria-label="Baixar uma unidade do estoque"
                          size="xs"
                          variant="outline"
                          colorScheme="orange"
                          disabled={
                            busyId === product.id || getTotalStock(product) <= 0
                          }
                          onClick={() => handleStockMinus(product)}
                        >
                          <IoRemoveOutline />
                        </IconButton>
                      )}
                    {showSoftDeactivate && (
                      <Button
                        type="button"
                        size="xs"
                        variant={product.isActive ? "outline" : "solid"}
                        colorScheme={product.isActive ? "gray" : "green"}
                        disabled={busyId === product.id}
                        title={
                          product.isActive
                            ? "Pausar na vitrine (estoque será zerado)"
                            : "Reativar na vitrine"
                        }
                        onClick={() => handleToggleActive(product)}
                      >
                        {product.isActive ? (
                          <>
                            <IoPauseCircle style={{ marginRight: 4 }} />
                            Pausar vitrine
                          </>
                        ) : (
                          <>
                            <IoPlayCircle style={{ marginRight: 4 }} />
                            Reativar
                          </>
                        )}
                      </Button>
                    )}
                  </VStack>
                </Table.Cell>
              )}
              <Table.Cell>
                <HStack justify="center" gap={2}>
                  {onView && (
                    <IconButton
                      type="button"
                      aria-label="Ver produto"
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(product);
                      }}
                    >
                      <IoEye />
                    </IconButton>
                  )}
                  {onEdit && (
                    <IconButton
                      type="button"
                      aria-label="Editar produto"
                      size="sm"
                      variant="ghost"
                      colorScheme="orange"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(product);
                      }}
                    >
                      <IoPencil />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      type="button"
                      aria-label="Deletar produto"
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(product);
                      }}
                    >
                      <IoTrash />
                    </IconButton>
                  )}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <PauseProductDialog
        product={pauseConfirmProduct}
        isLoading={!!pauseConfirmProduct && busyId === pauseConfirmProduct.id}
        onCancel={() => setPauseConfirmProduct(null)}
        onConfirm={handleConfirmPause}
      />
    </>
  );
}
