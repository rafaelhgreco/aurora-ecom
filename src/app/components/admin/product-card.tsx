/**
 * Componente: Product Card
 *
 * Card de produto para visualização em grid
 */

"use client";

import {
  Badge,
  Card,
  Flex,
  HStack,
  IconButton,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IoEye, IoPencil, IoTrash } from "react-icons/io5";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";

interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
}: ProductCardProps) {
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
              {formatPrice(product.price || 0)}
            </Text>
            <Badge colorScheme={product.isActive ? "green" : "gray"}>
              {product.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">
              Estoque: <strong>{product.stock}</strong>
            </Text>
            {product.category && (
              <Badge variant="subtle">{product.category}</Badge>
            )}
          </HStack>
        </VStack>
      </Card.Body>

      <Card.Footer>
        <Flex justify="flex-end" width="full" gap={2}>
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
        </Flex>
      </Card.Footer>
    </Card.Root>
  );
}
