/**
 * Componente: Category Products Card
 *
 * Fallback mobile de CategoryProductsTable (abaixo de md). Um card por
 * produto, com checkbox de seleção — a barra "selecionar todos" fica no
 * componente pai (BulkMoveCategoryBar).
 */

"use client";

import { Badge, Card, HStack, Image, Text, VStack } from "@chakra-ui/react";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";
import { Checkbox } from "@/components/ui/checkbox";
import { getTotalStock } from "@/shared/product-stock-helpers";

interface CategoryProductsCardProps {
  product: Product;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function CategoryProductsCard({
  product,
  selected,
  onToggle,
}: CategoryProductsCardProps) {
  return (
    <Card.Root
      variant="outline"
      bg={selected ? "blue.50" : undefined}
      cursor="pointer"
      onClick={() => onToggle(product.id as string)}
    >
      <Card.Body>
        <HStack align="flex-start" gap={3}>
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(product.id as string)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Selecionar ${product.title}`}
            mt={1}
          />
          <Image
            src={product.imageUrl}
            alt={product.title}
            boxSize="64px"
            objectFit="cover"
            borderRadius="md"
          />
          <VStack align="stretch" gap={1} flex={1}>
            <Text fontWeight="medium" lineClamp={1}>
              {product.title}
            </Text>
            <HStack justify="space-between">
              <Text fontWeight="bold" color="blue.500">
                {formatPrice(product.price)}
              </Text>
              <Badge colorScheme={getTotalStock(product) > 0 ? "green" : "red"}>
                {getTotalStock(product)} un.
              </Badge>
            </HStack>
          </VStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
