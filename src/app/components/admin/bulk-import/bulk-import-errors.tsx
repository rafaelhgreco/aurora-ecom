"use client";

import { Box, Table, Text } from "@chakra-ui/react";
import type { BulkImportRowError } from "@/core/schemas/bulk-import.schema";

interface BulkImportErrorsProps {
  rowErrors: BulkImportRowError[];
  groupErrors: Array<{ sku_base: string; message: string }>;
}

export function BulkImportErrors({
  rowErrors,
  groupErrors,
}: BulkImportErrorsProps) {
  if (rowErrors.length === 0 && groupErrors.length === 0) {
    return (
      <Text color="green.600" fontWeight="medium">
        Nenhum erro encontrado na validação.
      </Text>
    );
  }

  return (
    <Box>
      {rowErrors.length > 0 && (
        <Box mb={groupErrors.length > 0 ? 6 : 0}>
          <Text fontWeight="semibold" mb={2}>
            Erros por linha ({rowErrors.length})
          </Text>
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Linha</Table.ColumnHeader>
                  <Table.ColumnHeader>Campo</Table.ColumnHeader>
                  <Table.ColumnHeader>Mensagem</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rowErrors.map((err, i) => (
                  <Table.Row key={`${err.lineNumber}-${err.field}-${i}`}>
                    <Table.Cell>{err.lineNumber || "—"}</Table.Cell>
                    <Table.Cell>{err.field ?? "—"}</Table.Cell>
                    <Table.Cell>{err.message}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}

      {groupErrors.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb={2}>
            Erros por produto ({groupErrors.length})
          </Text>
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>SKU</Table.ColumnHeader>
                  <Table.ColumnHeader>Mensagem</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {groupErrors.map((err) => (
                  <Table.Row key={err.sku_base}>
                    <Table.Cell>{err.sku_base}</Table.Cell>
                    <Table.Cell>{err.message}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}
    </Box>
  );
}
