/**
 * Placeholder no formato do ProductCard — evita layout shift ao carregar a vitrine.
 */

import { Box, Flex, Skeleton, SkeletonText } from "@chakra-ui/react";
import { PRODUCT_CARD_IMAGE_SHADOW } from "./product-card";

export function ProductCardSkeleton() {
  return (
    <Box w="full" aria-hidden>
      <Box
        position="relative"
        overflow="hidden"
        aspectRatio="3/4"
        w="full"
        borderRadius="lg"
        boxShadow={PRODUCT_CARD_IMAGE_SHADOW}
      >
        <Skeleton w="full" h="full" borderRadius="lg" />
      </Box>

      <Flex direction="column" mt="4" gap="2">
        <SkeletonText noOfLines={1} gap="2" />
        <SkeletonText noOfLines={1} gap="2" w="70%" />
        <Skeleton h="4" w="28" borderRadius="sm" mt="1" />

        <Flex
          display={{ base: "flex", md: "none" }}
          direction="column"
          gap="2"
          mt="2"
          w="full"
        >
          <Skeleton h="44px" w="full" borderRadius="md" />
          <Flex gap="2" flexWrap="wrap">
            <Skeleton h="6" w="10" borderRadius="md" />
            <Skeleton h="6" w="10" borderRadius="md" />
            <Skeleton h="6" w="10" borderRadius="md" />
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
