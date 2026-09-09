/**
 * Componente: Product Card
 *
 * Card de produto — usado como fallback mobile de ProductTable (abaixo de md).
 */

"use client";

import {
  Badge,
  Button,
  Card,
  Flex,
  HStack,
  IconButton,
  Image,
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

interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  /** Recarregar lista após ações rápidas (estoque / vitrine) */
  onInventoryChange?: () => void;
}

export function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  onInventoryChange,
}: ProductCardProps) {
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

  return (
    <Card.Root overflow="hidden" variant="outline">
      <Image
        src={product.imageUrl}
        alt={product.title}
        height="200px"
        objectFit="cover"
      />

      <Card.Body>
        <VStack align="stretch" gap={3}>
          <div>
            <Text fontWeight="bold" fontSize="lg" lineClamp={1}>
              {product.title}
            </Text>
            {product.subtitle && (
              <Text fontSize="sm" color="gray.500" lineClamp={1}>
                {product.subtitle}
              </Text>
            )}
          </div>

          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="xl" color="blue.500">
              {formatPrice(product.price)}
            </Text>
            <Badge colorScheme={product.isActive ? "green" : "gray"}>
              {product.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </HStack>

          <HStack justify="space-between">
            <Badge colorScheme={getTotalStock(product) > 0 ? "green" : "red"}>
              {getTotalStock(product)} un.
            </Badge>
            {product.category && (
              <Badge variant="subtle">{product.category}</Badge>
            )}
          </HStack>
        </VStack>
      </Card.Body>

      {showQuickActions && (
        <Card.Body pt={0}>
          <HStack gap={2} flexWrap="wrap">
            {showStockTools &&
              !(product.stockBySize && product.sizes?.length) && (
                <IconButton
                  type="button"
                  aria-label="Baixar uma unidade do estoque"
                  size="md"
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
                size="sm"
                flex={1}
                variant={product.isActive ? "outline" : "solid"}
                colorScheme={product.isActive ? "gray" : "green"}
                disabled={busyId === product.id}
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
          </HStack>
        </Card.Body>
      )}

      <Card.Footer>
        <Flex justify="flex-end" width="full" gap={2}>
          {onView && (
            <IconButton
              aria-label="Ver produto"
              size="md"
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
              size="md"
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
              size="md"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(product)}
            >
              <IoTrash />
            </IconButton>
          )}
        </Flex>
      </Card.Footer>

      <PauseProductDialog
        product={pauseConfirmProduct}
        isLoading={!!pauseConfirmProduct && busyId === pauseConfirmProduct.id}
        onCancel={() => setPauseConfirmProduct(null)}
        onConfirm={handleConfirmPause}
      />
    </Card.Root>
  );
}
