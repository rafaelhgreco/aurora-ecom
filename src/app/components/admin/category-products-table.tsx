/**
 * Componente: Category Products Table
 *
 * Tabela de produtos de uma subcategoria com checkbox de seleção (painel
 * "Gerenciar produtos"). Visível apenas em telas md+ — abaixo disso a lista
 * renderiza CategoryProductsCard.
 */

"use client";

import { Badge, Image, Table, Text } from "@chakra-ui/react";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";
import { Checkbox } from "@/components/ui/checkbox";
import { getTotalStock } from "@/shared/product-stock-helpers";

interface CategoryProductsTableProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export function CategoryProductsTable({
  products,
  selectedIds,
  onToggle,
  onToggleAll,
}: CategoryProductsTableProps) {
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
          <Table.ColumnHeader>Estoque</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {products.map((product) => (
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
              <Badge colorScheme={getTotalStock(product) > 0 ? "green" : "red"}>
                {getTotalStock(product)} un.
              </Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
