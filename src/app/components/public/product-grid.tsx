import { Box, Button, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import type { Product } from "@/core/schemas/product.schema";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
  /**
   * Dentro de layout que já tem Container/padding (ex.: página de categoria).
   * Remove margem superior e padding horizontal extras.
   */
  embed?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const ProductGrid = ({
  products,
  embed = false,
  page,
  totalPages,
  onPageChange,
}: ProductGridProps) => {
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

      {totalPages && totalPages > 1 && page && onPageChange && (
        <HStack justify="center" mt={12} gap={4}>
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <IoChevronBack /> Anterior
          </Button>

          <Text fontSize="sm" fontWeight="medium">
            Página {page} de {totalPages}
          </Text>

          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            Próxima <IoChevronForward />
          </Button>
        </HStack>
      )}
    </Box>
  );
};
