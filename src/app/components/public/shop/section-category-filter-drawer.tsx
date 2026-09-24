"use client";

import {
  Button,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerPositioner,
  DrawerRoot,
  DrawerTitle,
  Flex,
  Heading,
  IconButton,
  Portal,
} from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import {
  SectionCategoryFilterList,
  type SectionCategoryOption,
  type SectionSizeOption,
} from "./section-category-filter";

interface SectionCategoryFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryOptions: SectionCategoryOption[];
  selectedCategories: Set<string>;
  onToggleCategory: (name: string) => void;
  sizeOptions: SectionSizeOption[];
  selectedSizes: Set<string>;
  onToggleSize: (key: string) => void;
  onClear: () => void;
}

/** Drawer mobile dos filtros da seção — subcategoria e tamanho (padrão de CartDrawer). */
export function SectionCategoryFilterDrawer({
  isOpen,
  onClose,
  categoryOptions,
  selectedCategories,
  onToggleCategory,
  sizeOptions,
  selectedSizes,
  onToggleSize,
  onClear,
}: SectionCategoryFilterDrawerProps) {
  return (
    <DrawerRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: "full", md: "sm" }}
      placement="end"
    >
      <Portal>
        <DrawerBackdrop />
        <DrawerPositioner>
          <DrawerContent>
            <DrawerHeader pr="2">
              <DrawerTitle>
                <Flex align="center" justify="space-between" gap="3" w="full">
                  <Heading as="h2" size="lg">
                    Filtros
                  </Heading>
                  <IconButton
                    aria-label="Fechar filtros"
                    variant="ghost"
                    size="md"
                    colorScheme="gray"
                    onClick={onClose}
                  >
                    <FiX size={22} />
                  </IconButton>
                </Flex>
              </DrawerTitle>
            </DrawerHeader>
            <DrawerBody>
              <SectionCategoryFilterList
                categoryOptions={categoryOptions}
                selectedCategories={selectedCategories}
                onToggleCategory={onToggleCategory}
                sizeOptions={sizeOptions}
                selectedSizes={selectedSizes}
                onToggleSize={onToggleSize}
                onClear={onClear}
              />
            </DrawerBody>
            <DrawerFooter>
              <Button colorScheme="blue" width="full" onClick={onClose}>
                Ver resultados
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </DrawerPositioner>
      </Portal>
    </DrawerRoot>
  );
}
