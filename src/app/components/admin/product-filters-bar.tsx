/**
 * Componente: Product Filters Bar
 *
 * Filtro por Seção e Subcategoria na listagem de produtos do admin, em
 * cascata (subcategoria mostra só as opções da seção selecionada).
 */

"use client";

import {
  Box,
  createListCollection,
  Portal,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Stack,
} from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import type { SerializedCategory } from "@/core/schemas/category.schema";
import type { SerializedSection } from "@/core/schemas/section.schema";

const ALL_VALUE = "";

interface ProductFiltersBarProps {
  sections: SerializedSection[];
  categories: SerializedCategory[];
  sectionId: string;
  onSectionChange: (value: string) => void;
  categoryName: string;
  onCategoryChange: (value: string) => void;
}

export function ProductFiltersBar({
  sections,
  categories,
  sectionId,
  onSectionChange,
  categoryName,
  onCategoryChange,
}: ProductFiltersBarProps) {
  const sectionCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Todas as seções", value: ALL_VALUE },
          ...sections
            .filter((s): s is typeof s & { id: string } => !!s.id)
            .map((s) => ({ label: s.name, value: s.id })),
        ],
      }),
    [sections],
  );

  /**
   * Mesmo nome de subcategoria pode existir em seções distintas (ex.:
   * "Cremes" cadastrado em duas seções) — deduplicamos por nome, já que o
   * filtro compara produtos pelo nome da subcategoria, não pelo id.
   */
  const availableCategories = useMemo(() => {
    const list = sectionId
      ? categories.filter((c) => c.sectionId === sectionId)
      : categories;

    const seen = new Set<string>();
    return list.filter((c) => {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories, sectionId]);

  useEffect(() => {
    if (
      categoryName &&
      !availableCategories.some((c) => c.name === categoryName)
    ) {
      onCategoryChange(ALL_VALUE);
    }
  }, [availableCategories, categoryName, onCategoryChange]);

  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Todas as subcategorias", value: ALL_VALUE },
          ...availableCategories.map((c) => ({ label: c.name, value: c.name })),
        ],
      }),
    [availableCategories],
  );

  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      gap={3}
      mb={4}
      align={{ base: "stretch", md: "center" }}
    >
      <Box w={{ base: "full", md: "220px" }}>
        <SelectRoot
          collection={sectionCollection}
          value={[sectionId]}
          onValueChange={(details) =>
            onSectionChange(details.value[0] ?? ALL_VALUE)
          }
          size="sm"
        >
          <SelectTrigger>
            <SelectValueText placeholder="Seção" />
          </SelectTrigger>
          <Portal>
            <SelectPositioner>
              <SelectContent>
                {sectionCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </Portal>
        </SelectRoot>
      </Box>

      <Box w={{ base: "full", md: "220px" }}>
        <SelectRoot
          collection={categoryCollection}
          value={[categoryName]}
          onValueChange={(details) =>
            onCategoryChange(details.value[0] ?? ALL_VALUE)
          }
          size="sm"
        >
          <SelectTrigger>
            <SelectValueText placeholder="Subcategoria" />
          </SelectTrigger>
          <Portal>
            <SelectPositioner>
              <SelectContent>
                {categoryCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </Portal>
        </SelectRoot>
      </Box>
    </Stack>
  );
}
