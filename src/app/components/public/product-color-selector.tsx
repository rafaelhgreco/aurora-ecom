"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import type { ProductColorVariant } from "@/core/schemas/product.schema";

interface ProductColorSelectorProps {
  variants: ProductColorVariant[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

/**
 * Exibe as cores disponíveis; com uma única variante, mostra a cor já selecionada.
 */
export function ProductColorSelector({
  variants,
  selectedColor,
  onColorChange,
  disabled = false,
}: ProductColorSelectorProps) {
  if (variants.length === 0) return null;

  const isSingleColor = variants.length === 1;

  return (
    <Box w="full">
      <Text fontWeight="semibold" mb="3" textTransform="uppercase">
        Cor
      </Text>
      <Flex
        gap="2"
        flexWrap="wrap"
        role="listbox"
        aria-label="Cores disponíveis"
      >
        {variants.map((v) => {
          const active = v.color === selectedColor;
          return (
            <Button
              key={v.color}
              type="button"
              role="option"
              aria-selected={active}
              variant="outline"
              size="sm"
              px="4"
              py="2"
              h="auto"
              borderWidth="2px"
              borderColor={active ? "black" : "gray.200"}
              bg={active ? "gray.100" : "white"}
              fontWeight={active ? "semibold" : "normal"}
              cursor={disabled || isSingleColor ? "default" : "pointer"}
              opacity={disabled ? 0.5 : 1}
              onClick={() => {
                if (!disabled && !isSingleColor) onColorChange(v.color);
              }}
            >
              {v.color}
            </Button>
          );
        })}
      </Flex>
    </Box>
  );
}
