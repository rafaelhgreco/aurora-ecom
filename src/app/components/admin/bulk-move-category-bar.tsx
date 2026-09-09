/**
 * Componente: Bulk Move Category Bar
 *
 * Barra de ação do painel "Gerenciar produtos": mostra quantos produtos
 * estão selecionados, o seletor de subcategoria de destino (ou "Nenhuma") e
 * o botão para aplicar. No mobile fica sticky no topo — o `AdminNav` já fixa
 * uma bottom tab bar, então evitamos empilhar duas barras fixas.
 */

"use client";

import {
  Button,
  createListCollection,
  HStack,
  Portal,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";

export interface BulkMoveDestinationOption {
  label: string;
  value: string;
}

interface BulkMoveCategoryBarProps {
  selectedCount: number;
  destinationOptions: BulkMoveDestinationOption[];
  destination: string;
  onDestinationChange: (value: string) => void;
  onApply: () => void;
}

export function BulkMoveCategoryBar({
  selectedCount,
  destinationOptions,
  destination,
  onDestinationChange,
  onApply,
}: BulkMoveCategoryBarProps) {
  const collection = useMemo(
    () => createListCollection({ items: destinationOptions }),
    [destinationOptions],
  );

  const disabled = selectedCount === 0;

  return (
    <HStack
      justify="space-between"
      flexWrap="wrap"
      gap={3}
      p={3}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      position={{ base: "sticky", md: "static" }}
      top={{ base: 0, md: "auto" }}
      zIndex={{ base: "docked", md: "auto" }}
    >
      <Text fontWeight="medium">
        {selectedCount === 0
          ? "Nenhum produto selecionado"
          : `${selectedCount} produto${selectedCount > 1 ? "s" : ""} selecionado${selectedCount > 1 ? "s" : ""}`}
      </Text>

      <HStack gap={2} flexWrap="wrap">
        <SelectRoot
          collection={collection}
          value={[destination]}
          onValueChange={(details) =>
            onDestinationChange(details.value[0] ?? "")
          }
          disabled={disabled}
          minW="200px"
        >
          <SelectTrigger>
            <SelectValueText placeholder="Selecione o destino" />
          </SelectTrigger>
          <Portal>
            <SelectPositioner>
              <SelectContent>
                {collection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </Portal>
        </SelectRoot>

        <Button colorScheme="blue" disabled={disabled} onClick={onApply}>
          Aplicar
        </Button>
      </HStack>
    </HStack>
  );
}
