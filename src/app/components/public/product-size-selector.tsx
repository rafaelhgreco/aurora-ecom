import { Button, Flex } from "@chakra-ui/react";

interface ProductSizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSizeChange: (size: string) => void;
  availableSizes?: string[];
}

export const ProductSizeSelector = ({
  sizes,
  selectedSize,
  onSizeChange,
  availableSizes,
}: ProductSizeSelectorProps) => {
  return (
    <Flex gap="2" flexWrap="wrap">
      {sizes.map((size) => {
        const isAvailable = !availableSizes || availableSizes.includes(size);
        const isSelected = selectedSize === size;

        return (
          <Button
            key={size}
            size="md"
            variant={isSelected ? "solid" : "outline"}
            bg={isSelected ? "gray.900" : "transparent"}
            color={isSelected ? "white" : isAvailable ? "gray.900" : "gray.400"}
            borderColor={isSelected ? "gray.900" : "gray.300"}
            onClick={() => isAvailable && onSizeChange(size)}
            cursor={isAvailable ? "pointer" : "not-allowed"}
            opacity={isAvailable ? 1 : 0.5}
            _hover={
              isAvailable
                ? {
                    bg: isSelected ? "gray.800" : "gray.100",
                    borderColor: "gray.900",
                  }
                : {}
            }
            minW="48px"
            position="relative"
            textDecoration={!isAvailable ? "line-through" : "none"}
          >
            {size}
          </Button>
        );
      })}
    </Flex>
  );
};
