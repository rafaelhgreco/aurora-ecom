/**
 * Cards de navegação para cada seção do catálogo (dumb / reutilizável).
 */

import { Box, Heading, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import type { ShopCatalogRoute } from "@/core/catalog/shop-catalog";

interface ShopCategoryCardsProps {
  routes: readonly ShopCatalogRoute[];
}

export function ShopCategoryCards({ routes }: ShopCategoryCardsProps) {
  return (
    <VStack align="stretch" gap={4} w="full">
      <Heading as="h2" size="md" color="gray.800">
        Categorias
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} w="full">
        {routes.map((route) => (
          <Link
            key={route.slug}
            href={`/loja/${route.slug}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              overflow="hidden"
              transition="box-shadow 0.2s, border-color 0.2s"
              _hover={{
                borderColor: "gray.400",
                boxShadow: "md",
              }}
            >
              <VStack align="stretch" p={{ base: 5, md: 6 }} gap={2} bg="white">
                <Heading as="h3" size="sm" color="gray.900">
                  {route.title}
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  {route.description}
                </Text>
                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                  Ver produtos →
                </Text>
              </VStack>
            </Box>
          </Link>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
