import { SimpleGrid } from "@chakra-ui/react";
import { ProductCard } from "./product-card";

interface Product {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  price: number;
}

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
          id={product.id}
          imageUrl={product.imageUrl}
          title={product.title}
          subtitle={product.subtitle}
          price={product.price}
        />
      ))}
    </SimpleGrid>
  );
};
