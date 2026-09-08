/**
 * Modal de visualização de produto (admin).
 */

"use client";

import {
  Badge,
  Box,
  type DialogOpenChangeDetails,
  Flex,
  Grid,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useSections } from "@/app/hooks/use-sections";
import type { Product } from "@/app/types/product";
import { formatDateTime, formatPrice } from "@/app/utils/price-formatter";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTotalStock } from "@/shared/product-stock-helpers";

export interface ProductViewDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export function ProductViewDialog({
  open,
  product,
  onClose,
}: ProductViewDialogProps) {
  /** Root deve permanecer montado ao fechar para o dialog limpar scroll-lock (Ark/Zag). */
  const isOpen = Boolean(open && product);

  const { sections } = useSections();
  const shopLabel = product?.shopCategory
    ? (sections.find((s) => s.id === product.shopCategory)?.name ?? null)
    : null;

  return (
    <DialogRoot
      id="admin-product-view"
      open={isOpen}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onClose();
      }}
      size="xl"
    >
      {product ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do produto</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="stretch" gap={6}>
              {product.colorVariants && product.colorVariants.length > 0 ? (
                <VStack align="stretch" gap={4}>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                    Fotos por cor
                  </Text>
                  {product.colorVariants.map((v) => (
                    <Box key={v.color}>
                      <Text fontWeight="semibold" mb={2}>
                        {v.color}
                      </Text>
                      <HStack gap={2} flexWrap="wrap">
                        {v.images.map((img) => (
                          <Image
                            key={img}
                            src={img}
                            alt={`${product.title} ${v.color}`}
                            boxSize="80px"
                            objectFit="cover"
                            borderRadius="md"
                            border="2px solid"
                            borderColor="gray.200"
                          />
                        ))}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <>
                  <Box>
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width="100%"
                      height="300px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  </Box>

                  {product.images && product.images.length > 1 && (
                    <HStack gap={2} overflowX="auto">
                      {product.images.map((img, index) => (
                        <Image
                          key={img}
                          src={img}
                          alt={`${product.title} ${index + 1}`}
                          boxSize="80px"
                          objectFit="cover"
                          borderRadius="md"
                          border="2px solid"
                          borderColor="gray.200"
                        />
                      ))}
                    </HStack>
                  )}
                </>
              )}

              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold">
                    {product.title}
                  </Text>
                  {product.subtitle && (
                    <Text fontSize="md" color="gray.600">
                      {product.subtitle}
                    </Text>
                  )}
                </Box>

                <Flex gap={2} flexWrap="wrap">
                  <Badge colorScheme={product.isActive ? "green" : "gray"}>
                    {product.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  {product.category && (
                    <Badge variant="subtle">{product.category}</Badge>
                  )}
                  {shopLabel && (
                    <Badge variant="outline" colorScheme="blue">
                      {shopLabel}
                    </Badge>
                  )}
                </Flex>

                <Text whiteSpace="pre-wrap">{product.description}</Text>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Preço
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.500">
                      {formatPrice(product.price)}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Estoque total
                    </Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {getTotalStock(product)} un.
                    </Text>
                  </Box>
                </Grid>

                {product.sizes && product.sizes.length > 0 && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Tamanhos disponíveis
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      {product.sizes.map((size) => (
                        <Badge key={size} variant="outline">
                          {size}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}

                {product.colors && product.colors.length > 0 && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Cores disponíveis
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      {product.colors.map((color) => (
                        <Badge key={color} variant="outline">
                          {color}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}

                <Grid
                  templateColumns="repeat(2, 1fr)"
                  gap={4}
                  pt={4}
                  borderTop="1px solid"
                  borderColor="gray.200"
                >
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Criado em
                    </Text>
                    <Text fontSize="sm">
                      {formatDateTime(product.createdAt)}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Atualizado em
                    </Text>
                    <Text fontSize="sm">
                      {formatDateTime(product.updatedAt)}
                    </Text>
                  </Box>
                </Grid>
              </VStack>
            </VStack>
          </DialogBody>
        </DialogContent>
      ) : null}
    </DialogRoot>
  );
}
