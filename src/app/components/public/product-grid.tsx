import { SimpleGrid } from "@chakra-ui/react";
import type { Product } from "@/core/schemas/product.schema";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
      gap={{ base: "6", md: "12" }}
      w="full"
      mt="12"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id || ""}
          imageUrl={product.imageUrl}
          title={product.title}
          subtitle={product.subtitle}
          price={product.price}
          sizes={product.sizes}
        />
      ))}
    </SimpleGrid>
  );
};
