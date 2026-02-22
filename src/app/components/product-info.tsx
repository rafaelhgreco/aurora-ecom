import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { calculateInstallment, formatPrice } from "@/app/utils/price-formatter";
import { ProductQuantitySelector } from "./product-quantity-selector";
import { ProductSizeSelector } from "./product-size-selector";

interface ProductInfoProps {
  title: string;
  price: number;
  description: string;
  sizes: string[];
  availableSizes?: string[];
  maxQuantity?: number;
  onBuy: (size: string, quantity: number) => void;
}

export const ProductInfo = ({
  title,
  price,
  description,
  sizes,
  availableSizes,
  maxQuantity = 10,
  onBuy,
}: ProductInfoProps) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const formattedPrice = formatPrice(price);
  const formattedInstallment = calculateInstallment(price, 6);

  const handleBuy = () => {
    if (selectedSize) {
      onBuy(selectedSize, quantity);
    }
  };

  return (
    <VStack align="start" gap="6" w="full">
      <Box>
        <Heading as="h1" size="xl" fontWeight="medium" mb="2">
          {title}
        </Heading>
        <Text fontSize="2xl" fontWeight="semibold" color="gray.900">
          {formattedPrice}
        </Text>
        <Text fontSize="sm" color="gray.600">
          ou em até 6x de {formattedInstallment}
        </Text>
      </Box>

      <Box w="full">
        <Text
          fontSize="md"
          color="gray.700"
          lineHeight="tall"
          whiteSpace="pre-line"
        >
          {description}
        </Text>
      </Box>

      <Box w="full">
        <Text fontWeight="semibold" mb="3" textTransform="uppercase">
          Tamanho
        </Text>
        <ProductSizeSelector
          sizes={sizes}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          availableSizes={availableSizes}
        />
      </Box>

      <Box w="full">
        <Text fontWeight="semibold" mb="3" textTransform="uppercase">
          Quantidade
        </Text>
        <ProductQuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          max={maxQuantity}
        />
      </Box>

      <Button
        size="lg"
        w="full"
        bg="gray.900"
        color="white"
        onClick={handleBuy}
        disabled={!selectedSize}
        _hover={{ bg: "gray.800" }}
        _disabled={{
          bg: "gray.300",
          cursor: "not-allowed",
          opacity: 0.6,
        }}
      >
        COMPRAR
      </Button>
    </VStack>
  );
};
