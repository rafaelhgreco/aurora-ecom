"use client";

import { Button, HStack, Table, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoPencil } from "react-icons/io5";
import type { Product } from "@/core/schemas/product.schema";

interface DraftProductTableProps {
  products: Product[];
}

export function DraftProductTable({ products }: DraftProductTableProps) {
  const router = useRouter();

  const handleEnrich = (id: string) => {
    router.push(`/admin-produtos/editar/${id}`);
  };

  if (products.length === 0) {
    return (
      <Text textAlign="center" color="gray.500" py={8}>
        Nenhum produto em rascunho. Comece bipando produtos para enriquecê-los.
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap={4} w="full">
      <Table.Root size="sm" striped="odd" variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Código de Barras</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Estoque</Table.ColumnHeader>
            <Table.ColumnHeader>Criado em</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">Ação</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map((product) => (
            <Table.Row key={product.id}>
              <Table.Cell>
                <Text fontFamily="monospace" fontSize="sm">
                  {product.barcode || "—"}
                </Text>
              </Table.Cell>
              <Table.Cell textAlign="end" fontWeight="medium">
                {product.stock}
              </Table.Cell>
              <Table.Cell fontSize="sm" color="gray.600">
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </Table.Cell>
              <Table.Cell>
                <HStack justify="center" gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEnrich(product.id || "")}
                  >
                    <IoPencil style={{ marginRight: 4 }} />
                    Enriquecer
                  </Button>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </VStack>
  );
}
