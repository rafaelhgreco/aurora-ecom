"use client";

import { VStack } from "@chakra-ui/react";
import {
  ShopCategoryCards,
  ShopHomeHero,
  ShopPageShell,
} from "@/app/components/public/shop";
import { SHOP_CATALOG_ROUTES } from "@/core/catalog/shop-catalog";

/**
 * Hub da loja: vitrine editorial + acesso às categorias.
 */
export default function ShopPage() {
  return (
    <ShopPageShell>
      <VStack align="stretch" gap={{ base: 10, md: 12 }} w="full">
        <ShopHomeHero />
        <ShopCategoryCards routes={SHOP_CATALOG_ROUTES} />
      </VStack>
    </ShopPageShell>
  );
}
