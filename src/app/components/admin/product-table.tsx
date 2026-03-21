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
import {
  canPauseProductOnVitrine,
  pauseProductOnVitrineBlockedReason,
} from "@/shared/product-vitrine-rules";

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
    const next = !product.isActive;
    void runQuick(pid, async () => {
      const r = await setProductActiveFlagAction(pid, next);
      if (r.success) {
        toaster.create({
          title: next ? "Produto reativado" : "Produto inativado na vitrine",
          description: next
            ? "Volta a aparecer como disponível (se houver estoque)."
            : "Continua na loja como indisponível/esgotado.",
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
              <Badge colorScheme={getTotalStock(product) > 0 ? "green" : "red"}>
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
                      size="xs"
                      variant={product.isActive ? "outline" : "solid"}
                      colorScheme={product.isActive ? "gray" : "green"}
                      disabled={
                        busyId === product.id ||
                        (product.isActive &&
                          !canPauseProductOnVitrine({
                            stock: product.stock,
                            stockBySize: product.stockBySize,
                            sizes: product.sizes,
                          }))
                      }
                      title={
                        product.isActive &&
                        !canPauseProductOnVitrine({
                          stock: product.stock,
                          stockBySize: product.stockBySize,
                          sizes: product.sizes,
                        })
                          ? pauseProductOnVitrineBlockedReason({
                              stock: product.stock,
                              stockBySize: product.stockBySize,
                              sizes: product.sizes,
                            })
                          : undefined
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
                    aria-label="Ver produto"
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => onView(product)}
                  >
                    <IoEye />
                  </IconButton>
                )}
                {onEdit && (
                  <IconButton
                    aria-label="Editar produto"
                    size="sm"
                    variant="ghost"
                    colorScheme="orange"
                    onClick={() => onEdit(product)}
                  >
                    <IoPencil />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    aria-label="Deletar produto"
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => onDelete(product)}
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
  );
}
