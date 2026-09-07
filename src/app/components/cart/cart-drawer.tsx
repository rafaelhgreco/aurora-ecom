"use client";

/**
 * Component: CartDrawer
 * Drawer lateral do carrinho
 * Responsivo e unificado para desktop e mobile
 */

import {
  Box,
  Button,
  createListCollection,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerPositioner,
  DrawerRoot,
  DrawerTitle,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Portal,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiMinus, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { formatPrice } from "@/app/utils/price-formatter";
import type { ProductSize } from "@/core/entities";
import {
  getEffectiveColorVariants,
  getImagesForColor,
} from "@/shared/product-color-utils";
import type { EnrichedCartItem } from "../../hooks/use-cart";
import type { CartItemJSON } from "../../types/checkout";
import { WhatsAppCheckoutButton } from "../public/whatsapp-checkout-button";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: EnrichedCartItem[];
  total: string;
  loading?: boolean;
  onRemoveItem: (itemKey: string) => void;
  onUpdateQuantity: (itemKey: string, quantity: number) => void;
  onUpdateSize: (itemKey: string, size: ProductSize) => void;
  onUpdateColor?: (itemKey: string, color: string) => void;
  onClearCart: () => void;
  cartItems: CartItemJSON[];
  canCheckout?: boolean;
  checkoutBlockReason?: string;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  loading = false,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateSize,
  onUpdateColor,
  onClearCart,
  cartItems,
  canCheckout = true,
  checkoutBlockReason = "",
}: CartDrawerProps) {
  const isEmpty = items.length === 0;

  const [page, setPage] = useState(1);
  const limit = 10;
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Sincroniza página se remover itens
  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [totalPages, page]);

  // Sincroniza quantidade com estoque disponível quando exceder
  useEffect(() => {
    for (const { item, product } of items) {
      if (!product) continue;
      const size = item.variants?.size;
      const color = item.variants?.color;
      const stock =
        size && product.sizes?.includes(size)
          ? product.getStockForSize(size, color)
          : color
            ? product.getTotalStockForColor(color)
            : product.getTotalStock();
      const maxQty = Math.max(0, stock);
      if (maxQty > 0 && item.quantity > maxQty) {
        onUpdateQuantity(item.getUniqueKey(), maxQty);
      }
    }
  }, [items, onUpdateQuantity]);

  const paginatedItems = items.slice((page - 1) * limit, page * limit);

  return (
    <DrawerRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: "full", md: "md" }}
      placement="end"
    >
      <Portal>
        <DrawerBackdrop />
        <DrawerPositioner>
          <DrawerContent>
            <DrawerHeader pr="2">
              <DrawerTitle>
                <Flex align="center" justify="space-between" gap="3" w="full">
                  <Heading as="h2" size="lg" flex="1" minW="0">
                    Seu Carrinho
                  </Heading>
                  <HStack gap="1" flexShrink={0}>
                    {!isEmpty && (
                      <Button
                        variant="ghost"
                        size="sm"
                        colorScheme="red"
                        onClick={onClearCart}
                      >
                        Limpar Carrinho
                      </Button>
                    )}
                    <IconButton
                      aria-label="Fechar carrinho"
                      variant="ghost"
                      size="md"
                      colorScheme="gray"
                      onClick={onClose}
                    >
                      <FiX size={22} />
                    </IconButton>
                  </HStack>
                </Flex>
              </DrawerTitle>
            </DrawerHeader>

            <DrawerBody
              bg="white"
              display="flex"
              flexDirection="column"
              gap="4"
            >
              {loading && (
                <Text textAlign="center" py="8" color="gray.500">
                  Carregando...
                </Text>
              )}

              {!loading && isEmpty && (
                <VStack py="12" gap="4" flex="1" justify="center">
                  <Text fontSize="lg" color="gray.600">
                    Seu carrinho está vazio
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Adicione produtos para começar
                  </Text>
                  <Button mt="4" variant="outline" onClick={onClose}>
                    Continuar Comprando
                  </Button>
                </VStack>
              )}

              {!loading && !isEmpty && (
                <Stack gap="4" flex="1" pb="4">
                  {paginatedItems.map((enrichedItem) => {
                    const { item, product, subtotal, error } = enrichedItem;
                    const itemKey = item.getUniqueKey();
                    const selectedSize = item.variants?.size;
                    const selectedColor = item.variants?.color;
                    const colorVariants = product
                      ? getEffectiveColorVariants(product)
                      : [];
                    const colorOptions = colorVariants.map((v) => v.color);
                    const thumbImgs =
                      product && selectedColor
                        ? getImagesForColor(product, selectedColor)
                        : [];
                    const thumbUrl =
                      thumbImgs[0] ?? product?.imageUrl ?? "/placeholder.png";
                    const hasSizes = product?.sizes && product.sizes.length > 0;
                    const availableSizes = product
                      ? product.getAvailableSizes(selectedColor)
                      : [];
                    const stockForSize =
                      hasSizes && selectedSize && product
                        ? product.getStockForSize(selectedSize, selectedColor)
                        : product
                          ? selectedColor
                            ? product.getTotalStockForColor(selectedColor)
                            : product.getTotalStock()
                          : 0;
                    const maxQty = Math.max(1, stockForSize);
                    const showColorPicker =
                      Boolean(onUpdateColor) && colorOptions.length > 1;

                    return (
                      <Box
                        key={itemKey}
                        p="3"
                        borderWidth="1px"
                        borderRadius="md"
                        bg={error ? "red.50" : "white"}
                      >
                        <Flex gap="3" direction="row" align="flex-start">
                          <Box
                            flexShrink={0}
                            position="relative"
                            w="80px"
                            h="80px"
                            bg="gray.50"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.100"
                            overflow="hidden"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Image
                              src={thumbUrl}
                              alt={product?.title || "Produto"}
                              w="full"
                              h="full"
                              objectFit="contain"
                            />
                          </Box>

                          <VStack align="stretch" flex="1" gap="2">
                            <Flex justify="space-between" align="start">
                              <Box flex="1" pr="2">
                                <Text
                                  fontWeight="semibold"
                                  fontSize="md"
                                  lineClamp={2}
                                >
                                  {product?.title || "Carregando..."}
                                </Text>
                                {product && (
                                  <Text fontSize="sm" color="gray.600" mt="1">
                                    {formatPrice(product.price)}
                                  </Text>
                                )}
                              </Box>

                              <IconButton
                                aria-label="Remover item"
                                size="sm"
                                variant="surface"
                                colorScheme="red"
                                onClick={() => onRemoveItem(itemKey)}
                              >
                                <FiTrash2 />
                              </IconButton>
                            </Flex>

                            <Flex
                              direction="row"
                              align="center"
                              justify="space-between"
                              mt="1"
                              flexWrap="wrap"
                              gap="2"
                            >
                              {showColorPicker && product && (
                                <Box>
                                  <SelectRoot
                                    collection={createListCollection({
                                      items: colorOptions.map((c) => ({
                                        label: c,
                                        value: c,
                                      })),
                                    })}
                                    value={[selectedColor || ""]}
                                    onValueChange={(details) => {
                                      const color = details.value[0];
                                      if (color && onUpdateColor) {
                                        onUpdateColor(itemKey, color);
                                      }
                                    }}
                                    size="sm"
                                    width={{ base: "100%", sm: "120px" }}
                                  >
                                    <SelectTrigger>
                                      <SelectValueText placeholder="Cor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {colorOptions.map((c) => (
                                        <SelectItem key={c} item={c}>
                                          {c}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </SelectRoot>
                                </Box>
                              )}

                              {hasSizes && availableSizes.length > 0 && (
                                <Box>
                                  <SelectRoot
                                    collection={createListCollection({
                                      items: availableSizes.map((size) => ({
                                        label: size,
                                        value: size,
                                      })),
                                    })}
                                    value={[selectedSize || ""]}
                                    onValueChange={(details) => {
                                      const size = details.value[0];
                                      if (size && product) {
                                        onUpdateSize(
                                          itemKey,
                                          size as ProductSize,
                                        );
                                      }
                                    }}
                                    size="sm"
                                    width={{ base: "100%", sm: "100px" }}
                                  >
                                    <SelectTrigger>
                                      <SelectValueText placeholder="Tamanho" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableSizes.map((size) => (
                                        <SelectItem key={size} item={size}>
                                          {size} (
                                          {product
                                            ? product.getStockForSize(
                                                size,
                                                item.variants?.color,
                                              )
                                            : 0}{" "}
                                          em estoque)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </SelectRoot>
                                  {selectedSize && (
                                    <Text fontSize="xs" color="gray.500" mt="1">
                                      {stockForSize} em estoque para{" "}
                                      {selectedSize}
                                    </Text>
                                  )}
                                </Box>
                              )}

                              <HStack bg="gray.50" borderRadius="md" p="1">
                                <IconButton
                                  aria-label="Diminuir quantidade"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    onUpdateQuantity(
                                      itemKey,
                                      Math.max(1, item.quantity - 1),
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                >
                                  <FiMinus />
                                </IconButton>
                                <Input
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const qty =
                                      Number.parseInt(
                                        e.target.value.replace(/\D/g, ""),
                                        10,
                                      ) || 1;
                                    onUpdateQuantity(
                                      itemKey,
                                      Math.max(1, Math.min(qty, maxQty)),
                                    );
                                  }}
                                  size="sm"
                                  width="48px"
                                  textAlign="center"
                                  bg="white"
                                  border="1px solid"
                                  borderColor="gray.300"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  px="1"
                                />
                                <IconButton
                                  aria-label="Aumentar quantidade"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    onUpdateQuantity(
                                      itemKey,
                                      Math.min(item.quantity + 1, maxQty),
                                    )
                                  }
                                  disabled={!product || item.quantity >= maxQty}
                                >
                                  <FiPlus />
                                </IconButton>
                              </HStack>
                            </Flex>

                            <Flex justify="flex-end" mt="2">
                              <Text
                                fontWeight="bold"
                                fontSize="md"
                                color="green.600"
                              >
                                {formatPrice(subtotal)}
                              </Text>
                            </Flex>

                            {error && (
                              <Text fontSize="xs" color="red.600">
                                ⚠️ {error}
                              </Text>
                            )}

                            {product &&
                              item.quantity > maxQty &&
                              stockForSize > 0 && (
                                <Text fontSize="xs" color="orange.600">
                                  ⚠️ Apenas {maxQty} em estoque
                                  {selectedSize ? ` para ${selectedSize}` : ""}
                                  {selectedColor && colorOptions.length > 1
                                    ? ` · ${selectedColor}`
                                    : ""}
                                </Text>
                              )}
                          </VStack>
                        </Flex>
                      </Box>
                    );
                  })}

                  {totalPages > 1 && (
                    <HStack justify="center" mt="4" gap="4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>

                      <Text fontSize="sm" fontWeight="medium">
                        Página {page} de {totalPages}
                      </Text>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        Próxima
                      </Button>
                    </HStack>
                  )}
                </Stack>
              )}
            </DrawerBody>

            <DrawerFooter
              display="flex"
              flexDirection="column"
              gap="4"
              bg="white"
              borderTopWidth="1px"
              p="4"
            >
              {!isEmpty && (
                <Flex
                  justify="space-between"
                  align="center"
                  p="4"
                  w="full"
                  bg="gray.50"
                  borderRadius="md"
                >
                  <Text fontSize="lg" fontWeight="semibold">
                    Total:
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {total}
                  </Text>
                </Flex>
              )}

              {!isEmpty && !canCheckout && checkoutBlockReason && (
                <Box
                  p="3"
                  w="full"
                  bg="orange.50"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="orange.200"
                >
                  <Text fontSize="sm" color="orange.700" fontWeight="semibold">
                    ⚠️ Não é possível finalizar
                  </Text>
                  <Text fontSize="sm" color="orange.600" mt="1">
                    {checkoutBlockReason}
                  </Text>
                </Box>
              )}

              <Flex gap="3" width="full" direction="column">
                {!isEmpty && (
                  <Box w="full">
                    <WhatsAppCheckoutButton
                      cart={cartItems}
                      buttonText="Finalizar pelo WhatsApp"
                      size="lg"
                      disabled={!canCheckout}
                      onSuccess={() => {
                        onClose();
                      }}
                    />
                  </Box>
                )}

                <Button variant="outline" onClick={onClose} size="lg" w="full">
                  Continuar Comprando
                </Button>
              </Flex>
            </DrawerFooter>
          </DrawerContent>
        </DrawerPositioner>
      </Portal>
    </DrawerRoot>
  );
}
