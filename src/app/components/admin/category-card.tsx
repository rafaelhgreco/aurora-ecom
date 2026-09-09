/**
 * Componente: Category Card
 *
 * Fallback mobile de CategoryTable (abaixo de md).
 */

"use client";

import { Card, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { IoPencil, IoTrash } from "react-icons/io5";
import type { Category } from "@/app/types/category";

interface CategoryCardProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryCard({
  categories,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <VStack align="stretch" gap={3} display={{ base: "flex", md: "none" }}>
      {categories.map((category) => (
        <Card.Root key={category.id} variant="outline">
          <Card.Body>
            <HStack justify="space-between" gap={3}>
              <VStack align="stretch" gap={0}>
                <Text fontWeight="medium">{category.name}</Text>
                <Text fontSize="sm" color="gray.500">
                  {category.createdAt
                    ? new Date(category.createdAt).toLocaleDateString("pt-BR")
                    : "-"}
                </Text>
              </VStack>

              <HStack gap={1}>
                <IconButton
                  type="button"
                  aria-label="Editar categoria"
                  size="md"
                  variant="ghost"
                  colorScheme="orange"
                  onClick={() => onEdit(category)}
                >
                  <IoPencil />
                </IconButton>
                <IconButton
                  type="button"
                  aria-label="Deletar categoria"
                  size="md"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onDelete(category)}
                >
                  <IoTrash />
                </IconButton>
              </HStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      ))}
    </VStack>
  );
}
