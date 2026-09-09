/**
 * Componente: Promotion Products Table
 *
 * Tabela de produtos da tela "Gerenciar produtos" de uma promoção, com
 * checkbox de seleção (mirror de `CategoryProductsTable`) e, para produtos já
 * associados a esta promoção, um campo inline de "valor base" (override) —
 * cobre o modo "editar o valor e depois aplicar o percentual". Visível
 * apenas em telas md+ — abaixo disso a lista renderiza PromotionProductsCard.
 */

"use client";

import { Badge, Image, Input, Table, Text } from "@chakra-ui/react";
import { useState } from "react";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";
import { Checkbox } from "@/components/ui/checkbox";
import { getTotalStock } from "@/shared/product-stock-helpers";

interface OverridePriceInputProps {
  product: Product;
  onCommit: (overridePrice: number | null) => void;
}

function OverridePriceInput({ product, onCommit }: OverridePriceInputProps) {
  const initial = product.promotionOverridePrice ?? "";
  const [value, setValue] = useState<string>(String(initial));

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed === "") {
      if (product.promotionOverridePrice != null) onCommit(null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setValue(String(initial));
      return;
    }
    if (parsed !== product.promotionOverridePrice) onCommit(parsed);
  };

  return (
    <Input
      size="sm"
      type="number"
      step="0.01"
      min={0}
      placeholder="Preço de tabela"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      onClick={(e) => e.stopPropagation()}
      w="140px"
    />
  );
}

interface PromotionProductsTableProps {
  products: Product[];
  promotionId: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onSetOverridePrice: (productId: string, overridePrice: number | null) => void;
}

export function PromotionProductsTable({
  products,
  promotionId,
  selectedIds,
  onToggle,
  onToggleAll,
  onSetOverridePrice,
}: PromotionProductsTableProps) {
  if (products.length === 0) {
    return null;
  }

  const allSelected = products.every((p) => selectedIds.has(p.id as string));
  const someSelected =
    !allSelected && products.some((p) => selectedIds.has(p.id as string));

  return (
    <Table.Root
      variant="outline"
      size="md"
      display={{ base: "none", md: "table" }}
    >
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>
            <Checkbox
              checked={someSelected ? "indeterminate" : allSelected}
              onCheckedChange={() => onToggleAll()}
              aria-label="Selecionar todos os produtos"
            />
          </Table.ColumnHeader>
          <Table.ColumnHeader>Imagem</Table.ColumnHeader>
          <Table.ColumnHeader>Produto</Table.ColumnHeader>
          <Table.ColumnHeader>Preço</Table.ColumnHeader>
          <Table.ColumnHeader>Valor base</Table.ColumnHeader>
          <Table.ColumnHeader>Estoque</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {products.map((product) => {
          const isAssigned = product.promotionId === promotionId;
          return (
            <Table.Row
              key={product.id}
              bg={selectedIds.has(product.id as string) ? "blue.50" : undefined}
              cursor="pointer"
              onClick={() => onToggle(product.id as string)}
            >
              <Table.Cell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(product.id as string)}
                  onCheckedChange={() => onToggle(product.id as string)}
                  aria-label={`Selecionar ${product.title}`}
                />
              </Table.Cell>
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
                <Text fontWeight="medium">{formatPrice(product.price)}</Text>
              </Table.Cell>
              <Table.Cell>
                {isAssigned ? (
                  <OverridePriceInput
                    product={product}
                    onCommit={(overridePrice) =>
                      onSetOverridePrice(product.id as string, overridePrice)
                    }
                  />
                ) : (
                  <Text fontSize="sm" color="gray.400">
                    —
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Badge
                  colorScheme={getTotalStock(product) > 0 ? "green" : "red"}
                >
                  {getTotalStock(product)} un.
                </Badge>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
