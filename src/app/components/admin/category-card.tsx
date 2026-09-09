/**
 * Componente: Category Card
 *
 * Fallback mobile de CategoryTable (abaixo de md).
 */

"use client";

import {
  Card,
  HStack,
  IconButton,
  Menu,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IoEllipsisVertical,
  IoListOutline,
  IoPencil,
  IoTrash,
} from "react-icons/io5";
import type { Category } from "@/app/types/category";

interface CategoryCardProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onManageProducts: (category: Category) => void;
}

export function CategoryCard({
  categories,
  onEdit,
  onDelete,
  onManageProducts,
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

              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    type="button"
                    aria-label="Ações da categoria"
                    size="md"
                    variant="ghost"
                    minW="44px"
                    minH="44px"
                  >
                    <IoEllipsisVertical />
                  </IconButton>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Menu.Item
                        value="manage-products"
                        onClick={() => onManageProducts(category)}
                      >
                        <IoListOutline />
                        Gerenciar produtos
                      </Menu.Item>
                      <Menu.Item value="edit" onClick={() => onEdit(category)}>
                        <IoPencil />
                        Editar categoria
                      </Menu.Item>
                      <Menu.Item
                        value="delete"
                        color="red.600"
                        onClick={() => onDelete(category)}
                      >
                        <IoTrash />
                        Excluir categoria
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </HStack>
          </Card.Body>
        </Card.Root>
      ))}
    </VStack>
  );
}
