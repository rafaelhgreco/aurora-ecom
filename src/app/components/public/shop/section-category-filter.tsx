"use client";

import { Box, Button, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { Checkbox } from "@/components/ui/checkbox";

export interface SectionCategoryOption {
  name: string;
  count: number;
}

export interface SectionSizeOption {
  key: string;
  label: string;
  count: number;
}

interface FilterCheckboxGroupProps {
  title: string;
  options: { value: string; label: string; count: number }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  /** `true` distribui as opções numa grade de colunas iguais (tamanhos são curtos), mantendo as caixas alinhadas. */
  inline?: boolean;
  /** `true` começa fechado e o título vira um botão com seta para expandir. */
  collapsible?: boolean;
  /** `false` esconde a contagem de produtos ao lado de cada opção. */
  showCount?: boolean;
}

function FilterCheckboxGroup({
  title,
  options,
  selected,
  onToggle,
  inline = false,
  collapsible = false,
  showCount = true,
}: FilterCheckboxGroupProps) {
  const [isOpen, setIsOpen] = useState(!collapsible);

  if (options.length === 0) return null;

  const items = options.map((option) => (
    <Checkbox
      key={option.value}
      checked={selected.has(option.value)}
      onCheckedChange={() => onToggle(option.value)}
    >
      {showCount ? `${option.label} (${option.count})` : option.label}
    </Checkbox>
  ));

  const heading = (
    <Text fontWeight="semibold" fontSize="sm">
      {title}
      {collapsible && selected.size > 0 ? ` (${selected.size})` : ""}
    </Text>
  );

  return (
    <VStack align="stretch" gap={2}>
      {collapsible ? (
        <Button
          variant="ghost"
          size="sm"
          justifyContent="space-between"
          px={2}
          mx={-2}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {heading}
          <Box
            as="span"
            display="inline-flex"
            transition="transform 0.2s"
            transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"}
          >
            <FiChevronRight />
          </Box>
        </Button>
      ) : (
        heading
      )}
      {!isOpen ? null : inline ? (
        <Grid
          templateColumns="repeat(auto-fill, minmax(5.25rem, 1fr))"
          columnGap={3}
          rowGap={2}
        >
          {items}
        </Grid>
      ) : (
        <VStack align="stretch" gap={2}>
          {items}
        </VStack>
      )}
    </VStack>
  );
}

interface SectionCategoryFilterListProps {
  categoryOptions: SectionCategoryOption[];
  selectedCategories: Set<string>;
  onToggleCategory: (name: string) => void;
  sizeOptions: SectionSizeOption[];
  selectedSizes: Set<string>;
  onToggleSize: (key: string) => void;
  onClear: () => void;
  /** Há filtro ativo fora desta lista (ex.: seções no hub) que `onClear` também remove. */
  hasExternalSelection?: boolean;
}

/** Filtros da seção (subcategorias e tamanhos, com contagem) — usados na sidebar (desktop) e no drawer (mobile). */
export function SectionCategoryFilterList({
  categoryOptions,
  selectedCategories,
  onToggleCategory,
  sizeOptions,
  selectedSizes,
  onToggleSize,
  onClear,
  hasExternalSelection = false,
}: SectionCategoryFilterListProps) {
  const hasSelection =
    hasExternalSelection || selectedCategories.size + selectedSizes.size > 0;

  return (
    <VStack align="stretch" gap={5}>
      {/* Altura reservada: o botão só aparece/some com fade, sem mover o layout. */}
      <HStack justify="flex-end" h={5}>
        <Button
          size="xs"
          variant="plain"
          h="auto"
          minW="auto"
          p={0}
          fontWeight="normal"
          color="gray.500"
          textDecoration="underline"
          textUnderlineOffset="3px"
          _hover={{ color: "gray.800" }}
          opacity={hasSelection ? 1 : 0}
          transform={hasSelection ? "translateY(0)" : "translateY(-4px)"}
          pointerEvents={hasSelection ? "auto" : "none"}
          visibility={hasSelection ? "visible" : "hidden"}
          transition="opacity 0.25s ease, transform 0.25s ease, visibility 0.25s, color 0.15s"
          _motionReduce={{ transition: "none" }}
          aria-hidden={!hasSelection}
          tabIndex={hasSelection ? 0 : -1}
          onClick={onClear}
        >
          Limpar filtros
        </Button>
      </HStack>
      <FilterCheckboxGroup
        title="Subcategorias"
        options={categoryOptions.map((o) => ({
          value: o.name,
          label: o.name,
          count: o.count,
        }))}
        selected={selectedCategories}
        onToggle={onToggleCategory}
        collapsible
      />
      <FilterCheckboxGroup
        title="Tamanhos"
        options={sizeOptions.map((o) => ({
          value: o.key,
          label: o.label,
          count: o.count,
        }))}
        selected={selectedSizes}
        onToggle={onToggleSize}
        inline
        collapsible
        showCount={false}
      />
    </VStack>
  );
}
