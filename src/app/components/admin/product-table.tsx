/**
 * Componente: Product Table
 *
 * Tabela de produtos com ações (ver, editar, deletar)
 */

"use client";

import {
  Badge,
  HStack,
  IconButton,
  Image,
  Table,
  Text,
} from "@chakra-ui/react";
import { IoEye, IoPencil, IoTrash } from "react-icons/io5";
import type { Product } from "@/app/types/product";
import { formatPrice } from "@/app/utils/price-formatter";

interface ProductTableProps {
  products: Product[];
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductTable({
  products,
  onView,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        Nenhum produto encontrado
      </Text>
    );
  }

  return (
    <Table.Root variant="outline" size="md">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Imagem</Table.ColumnHeader>
          <Table.ColumnHeader>Produto</Table.ColumnHeader>
          <Table.ColumnHeader>Categoria</Table.ColumnHeader>
          <Table.ColumnHeader>Preço</Table.ColumnHeader>
          <Table.ColumnHeader>Estoque</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="center">Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {products.map((product) => (
          <Table.Row key={product.id}>
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
              <Text>{product.category || "-"}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text fontWeight="medium">{formatPrice(product.price)}</Text>
            </Table.Cell>
            <Table.Cell>
              <Badge colorScheme={product.stock > 0 ? "green" : "red"}>
                {product.stock} un.
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge colorScheme={product.isActive ? "green" : "gray"}>
                {product.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <HStack justify="center" gap={2}>
                {onView && (
                  <IconButton
                    aria-label="Ver produto"
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => onView(product)}
                  >
                    <IoEye />
                  </IconButton>
                )}
                {onEdit && (
                  <IconButton
                    aria-label="Editar produto"
                    size="sm"
                    variant="ghost"
                    colorScheme="orange"
                    onClick={() => onEdit(product)}
                  >
                    <IoPencil />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    aria-label="Deletar produto"
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => onDelete(product)}
                  >
                    <IoTrash />
                  </IconButton>
                )}
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
