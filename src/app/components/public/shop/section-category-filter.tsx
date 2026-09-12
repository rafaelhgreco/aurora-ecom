"use client";

import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";

export interface SectionCategoryOption {
  name: string;
  count: number;
}

interface SectionCategoryFilterListProps {
  options: SectionCategoryOption[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
}

/** Lista de checkboxes de subcategoria com contagem — usada na sidebar (desktop) e no drawer (mobile). */
export function SectionCategoryFilterList({
  options,
  selected,
  onToggle,
  onClear,
}: SectionCategoryFilterListProps) {
  return (
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between">
        <Text fontWeight="semibold" fontSize="sm">
          Subcategorias
        </Text>
        {selected.size > 0 && (
          <Button size="xs" variant="ghost" onClick={onClear}>
            Limpar filtros
          </Button>
        )}
      </HStack>
      <VStack align="stretch" gap={2}>
        {options.map((option) => (
          <Checkbox
            key={option.name}
            checked={selected.has(option.name)}
            onCheckedChange={() => onToggle(option.name)}
          >
            {option.name} ({option.count})
          </Checkbox>
        ))}
      </VStack>
    </VStack>
  );
}
