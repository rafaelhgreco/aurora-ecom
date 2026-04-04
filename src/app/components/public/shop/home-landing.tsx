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
