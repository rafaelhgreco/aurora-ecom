"use client";

import { Button, Card, HStack, Table, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoPencil } from "react-icons/io5";
import type { SerializedProduct } from "@/core/schemas/product.schema";

interface DraftProductTableProps {
  products: SerializedProduct[];
}

function formatCreatedAt(createdAt: SerializedProduct["createdAt"]) {
  return createdAt
    ? new Date(createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
}

export function DraftProductTable({ products }: DraftProductTableProps) {
  const router = useRouter();

  const handleEnrich = (id: string) => {
    router.push(`/admin/editar/${id}`);
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
      <Table.Root
        size="sm"
        striped
        variant="outline"
        display={{ base: "none", md: "table" }}
      >
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
                {formatCreatedAt(product.createdAt)}
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

      <VStack align="stretch" gap={3} display={{ base: "flex", md: "none" }}>
        {products.map((product) => (
          <Card.Root key={product.id} variant="outline">
            <Card.Body>
              <VStack align="stretch" gap={2}>
                <Text fontFamily="monospace" fontWeight="medium">
                  {product.barcode || "—"}
                </Text>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Estoque: <strong>{product.stock}</strong>
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {formatCreatedAt(product.createdAt)}
                  </Text>
                </HStack>
                <Button
                  w="full"
                  variant="outline"
                  onClick={() => handleEnrich(product.id || "")}
                >
                  <IoPencil style={{ marginRight: 4 }} />
                  Enriquecer
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>
    </VStack>
  );
}
