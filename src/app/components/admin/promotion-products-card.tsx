/**
 * Componente: Promotion Products Card
 *
 * Fallback mobile de PromotionProductsTable (abaixo de md). Um card por
 * produto, com checkbox de seleção e, quando já associado a esta promoção,
 * um campo inline de "valor base" (override).
 */

"use client";

import {
  Badge,
  Card,
  HStack,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";
import { Checkbox } from "@/components/ui/checkbox";
import { getTotalStock } from "@/shared/product-stock-helpers";

interface PromotionProductsCardProps {
  product: Product;
  promotionId: string;
  selected: boolean;
  onToggle: (id: string) => void;
  onSetOverridePrice: (productId: string, overridePrice: number | null) => void;
}

export function PromotionProductsCard({
  product,
  promotionId,
  selected,
  onToggle,
  onSetOverridePrice,
}: PromotionProductsCardProps) {
  const isAssigned = product.promotionId === promotionId;
  const [value, setValue] = useState<string>(
    String(product.promotionOverridePrice ?? ""),
  );

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed === "") {
      if (product.promotionOverridePrice != null) {
        onSetOverridePrice(product.id as string, null);
      }
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setValue(String(product.promotionOverridePrice ?? ""));
      return;
    }
    if (parsed !== product.promotionOverridePrice) {
      onSetOverridePrice(product.id as string, parsed);
    }
  };

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
            {isAssigned && (
              <Input
                size="sm"
                type="number"
                step="0.01"
                min={0}
                placeholder="Valor base (padrão: preço de tabela)"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </VStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
