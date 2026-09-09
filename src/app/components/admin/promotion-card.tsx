/**
 * Componente: Promotion Card
 *
 * Fallback mobile de PromotionTable (abaixo de md).
 */

"use client";

import {
  Badge,
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
import type { Promotion } from "@/app/types/promotion";

interface PromotionCardProps {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  onManageProducts: (promotion: Promotion) => void;
}

export function PromotionCard({
  promotions,
  onEdit,
  onDelete,
  onManageProducts,
}: PromotionCardProps) {
  if (promotions.length === 0) {
    return null;
  }

  return (
    <VStack align="stretch" gap={3} display={{ base: "flex", md: "none" }}>
      {promotions.map((promotion) => (
        <Card.Root key={promotion.id} variant="outline">
          <Card.Body>
            <HStack justify="space-between" gap={3}>
              <VStack align="stretch" gap={1}>
                <Text fontWeight="medium">{promotion.name}</Text>
                <HStack gap={2}>
                  <Text fontSize="sm" color="gray.500">
                    {promotion.discountPercentage}% de desconto
                  </Text>
                  <Badge colorScheme={promotion.active ? "green" : "gray"}>
                    {promotion.active ? "Ativa" : "Inativa"}
                  </Badge>
                </HStack>
              </VStack>

              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    type="button"
                    aria-label="Ações da promoção"
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
                        onClick={() => onManageProducts(promotion)}
                      >
                        <IoListOutline />
                        Gerenciar produtos
                      </Menu.Item>
                      <Menu.Item value="edit" onClick={() => onEdit(promotion)}>
                        <IoPencil />
                        Editar promoção
                      </Menu.Item>
                      <Menu.Item
                        value="delete"
                        color="red.600"
                        onClick={() => onDelete(promotion)}
                      >
                        <IoTrash />
                        Excluir promoção
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
