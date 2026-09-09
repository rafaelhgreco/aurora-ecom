/**
 * Componente: Promotion Table
 *
 * Tabela de promoções com ações (gerenciar produtos, editar, deletar)
 */

"use client";

import { Badge, HStack, IconButton, Table, Text } from "@chakra-ui/react";
import { IoListOutline, IoPencil, IoTrash } from "react-icons/io5";
import type { Promotion } from "@/app/types/promotion";

interface PromotionTableProps {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  onManageProducts: (promotion: Promotion) => void;
}

export function PromotionTable({
  promotions,
  onEdit,
  onDelete,
  onManageProducts,
}: PromotionTableProps) {
  if (promotions.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        Nenhuma promoção cadastrada
      </Text>
    );
  }

  return (
    <Table.Root
      variant="outline"
      size="md"
      display={{ base: "none", md: "table" }}
    >
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Nome</Table.ColumnHeader>
          <Table.ColumnHeader>Desconto</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="center">Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {promotions.map((promotion) => (
          <Table.Row key={promotion.id}>
            <Table.Cell>
              <Text fontWeight="medium">{promotion.name}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text fontWeight="medium">{promotion.discountPercentage}%</Text>
            </Table.Cell>
            <Table.Cell>
              <Badge colorScheme={promotion.active ? "green" : "gray"}>
                {promotion.active ? "Ativa" : "Inativa"}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <HStack justify="center" gap={2}>
                <IconButton
                  type="button"
                  aria-label="Gerenciar produtos"
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => onManageProducts(promotion)}
                >
                  <IoListOutline />
                </IconButton>
                <IconButton
                  type="button"
                  aria-label="Editar promoção"
                  size="sm"
                  variant="ghost"
                  colorScheme="orange"
                  onClick={() => onEdit(promotion)}
                >
                  <IoPencil />
                </IconButton>
                <IconButton
                  type="button"
                  aria-label="Deletar promoção"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onDelete(promotion)}
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
