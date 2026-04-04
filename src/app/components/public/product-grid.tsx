import { Box, SimpleGrid } from "@chakra-ui/react";
import type { Product } from "@/core/schemas/product.schema";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
  /**
   * Dentro de layout que já tem Container/padding (ex.: página de categoria).
   * Remove margem superior e padding horizontal extras.
   */
  embed?: boolean;
}

export const ProductGrid = ({ products, embed = false }: ProductGridProps) => {
  return (
    <Box
      w="full"
      maxW="1280px"
      mx="auto"
      px={embed ? 0 : { base: "4", sm: "5", md: "6" }}
      pb="max(2rem, env(safe-area-inset-bottom, 0px))"
      mt={embed ? 0 : { base: "8", md: "12" }}
    >
      <SimpleGrid
        columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
        gap={{ base: "8", sm: "8", md: "10", lg: "12" }}
        w="full"
        alignItems="start"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </SimpleGrid>
    </Box>
  );
};
