/**
 * Grid de skeletons alinhado ao ProductGrid (mesmas colunas e espaçamento).
 */

import { Box, SimpleGrid } from "@chakra-ui/react";
import { ProductCardSkeleton } from "./product-card-skeleton";

const DEFAULT_COUNT = 6;

/** Chaves estáveis para lista estática de placeholders (evita key={index}) */
const SKELETON_KEYS = [
  "sk-a",
  "sk-b",
  "sk-c",
  "sk-d",
  "sk-e",
  "sk-f",
  "sk-g",
  "sk-h",
  "sk-i",
  "sk-j",
  "sk-k",
  "sk-l",
] as const;

interface ProductGridSkeletonProps {
  /** Quantidade de cards placeholder (padrão 6) */
  count?: number;
  /** Alinhado ao `embed` do ProductGrid */
  embed?: boolean;
}

export function ProductGridSkeleton({
  count = DEFAULT_COUNT,
  embed = false,
}: ProductGridSkeletonProps) {
  const n = Math.min(count, SKELETON_KEYS.length);

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
        {SKELETON_KEYS.slice(0, n).map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
