/**
 * Componente: Category Table
 *
 * Tabela de categorias com ações (editar, deletar)
 */

"use client";

import { HStack, IconButton, Table, Text } from "@chakra-ui/react";
import { IoPencil, IoTrash } from "react-icons/io5";
import type { Category } from "@/app/types/category";

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  if (categories.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        Nenhuma categoria cadastrada
      </Text>
    );
  }

  return (
    <Table.Root variant="outline" size="md">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Nome</Table.ColumnHeader>
          <Table.ColumnHeader>Criada em</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="center">Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {categories.map((category) => (
          <Table.Row key={category.id}>
            <Table.Cell>
              <Text fontWeight="medium">{category.name}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text fontSize="sm" color="gray.500">
                {category.createdAt
                  ? new Date(category.createdAt).toLocaleDateString("pt-BR")
                  : "-"}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <HStack justify="center" gap={2}>
                <IconButton
                  type="button"
                  aria-label="Editar categoria"
                  size="sm"
                  variant="ghost"
                  colorScheme="orange"
                  onClick={() => onEdit(category)}
                >
                  <IoPencil />
                </IconButton>
                <IconButton
                  type="button"
                  aria-label="Deletar categoria"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onDelete(category)}
                >
                  <IoTrash />
                </IconButton>
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
