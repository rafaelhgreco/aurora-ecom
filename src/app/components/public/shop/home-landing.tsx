/**
 * Conteúdo da home pública — destaque + atalhos para o catálogo (dumb).
 */

import { Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { SHOP_CATALOG_ROUTES } from "@/core/catalog/shop-catalog";
import { ShopCategoryCards } from "./shop-category-cards";
import { ShopHomeHero } from "./shop-home-hero";

export function HomeLanding() {
  return (
    <Container
      maxW="1200px"
      w="full"
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 8 }}
    >
      <VStack align="stretch" gap={{ base: 10, md: 12 }} w="full">
        <VStack align="stretch" gap={3} textAlign="center">
          <Heading as="h1" size={{ base: "xl", md: "2xl" }} color="gray.900">
            Aurora
          </Heading>
          <Text
            color="gray.600"
            fontSize={{ base: "md", md: "lg" }}
            maxW="xl"
            mx="auto"
          >
            Moda e cuidados em um só lugar. Navegue pelas categorias ou entre na
            loja para ver todos os produtos.
          </Text>
        </VStack>

        <ShopHomeHero
          title="Novidades"
          subtitle="Em breve: carrossel de campanhas e coleções em destaque."
        />

        <ShopCategoryCards routes={SHOP_CATALOG_ROUTES} />

        <Button
          asChild
          size="lg"
          colorScheme="gray"
          alignSelf="center"
          minW={{ base: "full", sm: "240px" }}
        >
          <Link href="/shop">Ver loja completa</Link>
        </Button>
      </VStack>
    </Container>
  );
}
