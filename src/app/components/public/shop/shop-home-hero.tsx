/**
 * Bloco de destaque da página /shop — título + área para filtro (breadcrumb).
 */

import { Heading, Text, VStack } from "@chakra-ui/react";

export interface ShopHomeHeroProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function ShopHomeHero({
  title = "Loja",
  subtitle = "Visualize todos os produtos e filtre por categoria.",
  children,
}: ShopHomeHeroProps) {
  return (
    <VStack align="stretch" gap={{ base: 4, md: 5 }} w="full">
      <VStack align="stretch" gap={1}>
        <Heading as="h1" size={{ base: "lg", md: "xl" }} color="gray.900">
          {title}
        </Heading>
        <Text color="gray.600" fontSize="sm">
          {subtitle}
        </Text>
      </VStack>
      {children}
    </VStack>
  );
}
