/**
 * Componente: Product Table
 *
 * Tabela de produtos com ações (ver, editar, deletar)
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
import { useState } from "react";
import {
  IoEye,
  IoPauseCircle,
  IoPencil,
  IoPlayCircle,
  IoRemoveOutline,
  IoTrash,
} from "react-icons/io5";
import {
  adjustProductStockAction,
  setProductActiveFlagAction,
} from "@/app/actions/products";
import { adminFeatureFlagsClient } from "@/app/config/feature-flags";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";
import { toaster } from "@/components/ui/toaster";
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pauseConfirmProduct, setPauseConfirmProduct] =
    useState<Product | null>(null);
  const showStockTools = adminFeatureFlagsClient.stockTools;
  const showSoftDeactivate = adminFeatureFlagsClient.softDeactivate;
  const showQuickColumn = showStockTools || showSoftDeactivate;

  const runQuick = async (productId: string, fn: () => Promise<unknown>) => {
    setBusyId(productId);
    try {
      await fn();
      onInventoryChange?.();
    } finally {
      setBusyId(null);
    }
  };

  const handleStockMinus = (product: Product) => {
    const pid = product.id;
    if (!pid) return;
    void runQuick(pid, async () => {
      const r = await adjustProductStockAction(pid, -1);
      if (r.success) {
        toaster.create({
          title: "Estoque atualizado",
          description: "Uma unidade foi baixada.",
          type: "success",
          duration: 3000,
        });
      } else {
        toaster.create({
          title: "Não foi possível ajustar",
          description: r.error,
          type: "error",
          duration: 5000,
        });
      }
    });
  };

  const handleToggleActive = (product: Product) => {
    const pid = product.id;
    if (!pid) return;
    if (product.isActive) {
      setPauseConfirmProduct(product);
      return;
    }
    void runQuick(pid, async () => {
      const r = await setProductActiveFlagAction(pid, true);
      if (r.success) {
        toaster.create({
          title: "Produto reativado",
          description: "Volta a aparecer como disponível (adicione estoque).",
          type: "success",
          duration: 4000,
        });
      } else {
        toaster.create({
          title: "Erro",
          description: r.error,
          type: "error",
          duration: 5000,
        });
      }
    });
  };

  const handleConfirmPause = async () => {
    const product = pauseConfirmProduct;
    const pid = product?.id;
    if (!pid) return;
    setPauseConfirmProduct(null);
    void runQuick(pid, async () => {
      const r = await setProductActiveFlagAction(pid, false);
      if (r.success) {
        toaster.create({
          title: "Produto pausado na vitrine",
          description: "Estoque zerado. Continua na loja como esgotado.",
          type: "success",
          duration: 4000,
        });
      } else {
        toaster.create({
          title: "Erro",
          description: r.error,
          type: "error",
          duration: 5000,
        });
      }
    });
  };

  if (products.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        Nenhum produto encontrado
      </Text>
    );
  }

  return (
    <>
      <Table.Root variant="outline" size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Imagem</Table.ColumnHeader>
            <Table.ColumnHeader>Produto</Table.ColumnHeader>
            <Table.ColumnHeader>Categoria</Table.ColumnHeader>
            <Table.ColumnHeader>Preço</Table.ColumnHeader>
            <Table.ColumnHeader>Estoque</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            {showQuickColumn && (
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
              {showQuickColumn && (
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
