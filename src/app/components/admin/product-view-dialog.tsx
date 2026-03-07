/**
 * Componente: Product View Dialog
 *
 * Modal para visualizar detalhes do produto
 */

"use client";

import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
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

interface ProductViewDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export function ProductViewDialog({
  open,
  product,
  onClose,
}: ProductViewDialogProps) {
  if (!product) return null;

  return (
    <DialogRoot
      open={open}
      onOpenChange={(e: { open: boolean }) => !e.open && onClose()}
      size="xl"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Produto</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={6}>
            {/* Imagem Principal */}
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

            {/* Galeria de Imagens */}
            {product.images && product.images.length > 1 && (
              <HStack gap={2} overflowX="auto">
                {product.images.map((img: string, index: number) => (
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

            {/* Informações */}
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

              <Flex gap={2}>
                <Badge colorScheme={product.isActive ? "green" : "gray"}>
                  {product.isActive ? "Ativo" : "Inativo"}
                </Badge>
                {product.category && (
                  <Badge variant="subtle">{product.category}</Badge>
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
                    Estoque
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {product.stock} unidades
                  </Text>
                </Box>
              </Grid>

              {product.sizes && product.sizes.length > 0 && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Tamanhos Disponíveis
                  </Text>
                  <HStack gap={2}>
                    {product.sizes.map((size: string) => (
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
                    Cores Disponíveis
                  </Text>
                  <HStack gap={2}>
                    {product.colors.map((color: string) => (
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
                borderTop="1px"
                borderColor="gray.200"
              >
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Criado em
                  </Text>
                  <Text fontSize="sm">{formatDateTime(product.createdAt)}</Text>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Atualizado em
                  </Text>
                  <Text fontSize="sm">{formatDateTime(product.updatedAt)}</Text>
                </Box>
              </Grid>
            </VStack>
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
