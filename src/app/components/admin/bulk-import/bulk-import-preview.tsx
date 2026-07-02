"use client";

import { Badge, Box, Table, Text } from "@chakra-ui/react";
import { formatPrice } from "@/app/utils/price-formatter";
import type { BulkImportPreviewProduct } from "@/core/import/validate-bulk-import";

interface BulkImportPreviewProps {
  products: BulkImportPreviewProduct[];
}

export function BulkImportPreview({ products }: BulkImportPreviewProps) {
  if (products.length === 0) {
    return <Text color="gray.600">Nenhum produto válido para importação.</Text>;
  }

  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>SKU</Table.ColumnHeader>
            <Table.ColumnHeader>Título</Table.ColumnHeader>
            <Table.ColumnHeader>Cores</Table.ColumnHeader>
            <Table.ColumnHeader>Tamanhos</Table.ColumnHeader>
            <Table.ColumnHeader>Estoque</Table.ColumnHeader>
            <Table.ColumnHeader>Preço</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map((p) => (
            <Table.Row key={p.sku_base}>
              <Table.Cell>
                <Text fontFamily="mono" fontSize="sm">
                  {p.sku_base}
                </Text>
              </Table.Cell>
              <Table.Cell>{p.title}</Table.Cell>
              <Table.Cell>{p.colors.join(", ")}</Table.Cell>
              <Table.Cell>{p.sizes.join(", ")}</Table.Cell>
              <Table.Cell>{p.totalStock}</Table.Cell>
              <Table.Cell>{formatPrice(p.price)}</Table.Cell>
              <Table.Cell>
                <Badge colorPalette={p.isActive ? "green" : "gray"}>
                  {p.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
