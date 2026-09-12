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
} from "./section-category-filter";

interface SectionCategoryFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  options: SectionCategoryOption[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
}

/** Drawer mobile de filtro por subcategoria (padrão de CartDrawer). */
export function SectionCategoryFilterDrawer({
  isOpen,
  onClose,
  options,
  selected,
  onToggle,
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
                    Filtrar por subcategoria
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
                options={options}
                selected={selected}
                onToggle={onToggle}
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
