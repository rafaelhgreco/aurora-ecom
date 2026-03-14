"use client";

/**
 * Component: CartModalDesktop
 * Versão desktop do modal do carrinho - Dialog style
 */

import {
  Box,
  Button,
  createListCollection,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import type { ProductSize } from "@/core/entities";
import type { EnrichedCartItem } from "../../hooks/use-cart";
import type { CartItemJSON } from "../../types/checkout";
import { WhatsAppCheckoutButton } from "../public/whatsapp-checkout-button";

interface CartModalDesktopProps {
  /**
   * Controla visibilidade do modal
   */
  isOpen: boolean;

  /**
   * Callback ao fechar modal
   */
  onClose: () => void;

  /**
   * Itens enriquecidos do carrinho
   */
  items: EnrichedCartItem[];

  /**
   * Total do carrinho (formatado)
   */
  total: string;

  /**
   * Está carregando produtos?
   */
  loading?: boolean;

  /**
   * Callback ao remover item
   */
  onRemoveItem: (itemKey: string) => void;

  /**
   * Callback ao atualizar quantidade
   */
  onUpdateQuantity: (itemKey: string, quantity: number) => void;

  /**
   * Callback ao atualizar tamanho
   */
  onUpdateSize: (itemKey: string, size: ProductSize) => void;

  /**
   * Callback ao limpar carrinho
   */
  onClearCart: () => void;

  /**
   * Cart items para WhatsApp
   */
  cartItems: CartItemJSON[];

  /**
   * Pode fazer checkout? (validação de estoque)
   */
  canCheckout?: boolean;

  /**
   * Motivo pelo qual o checkout está bloqueado
   */
  checkoutBlockReason?: string;
}

export function CartModalDesktop({
  isOpen,
  onClose,
  items,
  total,
  loading = false,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateSize,
  onClearCart,
  cartItems,
  canCheckout = true,
  checkoutBlockReason = "",
}: CartModalDesktopProps) {
  const isEmpty = items.length === 0;

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="lg"
      placement="center"
    >
      <DialogBackdrop />
      <DialogContent maxW="600px">
        <DialogHeader>
          <DialogTitle>
            <Flex align="center" justify="space-between">
              <Heading as="h2" size="lg">
                Seu Carrinho
              </Heading>
              {!isEmpty && (
                <Button
                  variant="ghost"
                  size="sm"
                  colorScheme="red"
                  onClick={onClearCart}
                  mr="8"
                >
                  Limpar Carrinho
                </Button>
              )}
            </Flex>
          </DialogTitle>
        </DialogHeader>

        <DialogCloseTrigger />

        <DialogBody display="flex" flexDirection="column" gap="4">
          {loading && (
            <Text textAlign="center" py="8" color="gray.500">
              Carregando...
            </Text>
          )}

          {!loading && isEmpty && (
            <VStack py="12" gap="4" flex="1" justify="center">
              <Text fontSize="4xl">🛒</Text>
              <Text fontSize="lg" color="gray.600">
                Seu carrinho está vazio
              </Text>
              <Text fontSize="sm" color="gray.500">
                Adicione produtos para começar
              </Text>
            </VStack>
          )}

          {!loading && !isEmpty && (
            <Stack gap="4" flex="1" maxH="500px" overflowY="auto" pb="4">
              {items.map((enrichedItem) => {
                const { item, product, subtotal, error } = enrichedItem;
                const itemKey = item.getUniqueKey();

                return (
                  <Box
                    key={itemKey}
                    p="4"
                    borderWidth="1px"
                    borderRadius="md"
                    bg={error ? "red.50" : "white"}
                  >
                    <Flex gap="4" direction="row">
                      {/* Imagem */}
                      <Box flexShrink={0}>
                        <Image
                          src={product?.imageUrl || "/placeholder.png"}
                          alt={product?.title || "Produto"}
                          width="80px"
                          height="80px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      </Box>

                      {/* Informações */}
                      <VStack align="stretch" flex="1" gap="2">
                        <Flex justify="space-between" align="start">
                          <Box>
                            <Text fontWeight="semibold" fontSize="md">
                              {product?.title || "Carregando..."}
                            </Text>
                            {product && (
                              <Text fontSize="sm" color="gray.600">
                                R$ {product.price.toFixed(2)}
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
                          {/* Seletor de Tamanho */}
                          {product?.sizes && product.sizes.length > 0 && (
                            <SelectRoot
                              collection={createListCollection({
                                items: product.sizes.map((size) => ({
                                  label: size,
                                  value: size,
                                })),
                              })}
                              value={[item.variants?.size || ""]}
                              onValueChange={(details) => {
                                const size = details.value[0];
                                if (size) {
                                  onUpdateSize(itemKey, size as ProductSize);
                                }
                              }}
                              size="sm"
                              width="90px"
                            >
                              <SelectTrigger>
                                <SelectValueText placeholder="Tamanho" />
                              </SelectTrigger>
                              <SelectContent>
                                {product.sizes.map((size) => (
                                  <SelectItem key={size} item={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectRoot>
                          )}

                          {/* Controles de Quantidade */}
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
                                  Number.parseInt(e.target.value, 10) || 1;
                                const maxQty = product?.stock || 999;
                                onUpdateQuantity(
                                  itemKey,
                                  Math.max(1, Math.min(qty, maxQty)),
                                );
                              }}
                              size="sm"
                              width="40px"
                              textAlign="center"
                              bg="transparent"
                              border="none"
                              type="number"
                              min={1}
                              max={product?.stock}
                            />

                            <IconButton
                              aria-label="Aumentar quantidade"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                onUpdateQuantity(itemKey, item.quantity + 1)
                              }
                              disabled={
                                !product || item.quantity >= product.stock
                              }
                            >
                              <FiPlus />
                            </IconButton>
                          </HStack>
                        </Flex>

                        <Flex justify="flex-end" mt="0">
                          <Text
                            fontWeight="bold"
                            fontSize="md"
                            color="green.600"
                          >
                            R$ {subtotal.toFixed(2)}
                          </Text>
                        </Flex>

                        {/* Avisos */}
                        {error && (
                          <Text fontSize="xs" color="red.600">
                            ⚠️ {error}
                          </Text>
                        )}

                        {product && item.quantity > product.stock && (
                          <Text fontSize="xs" color="orange.600">
                            ⚠️ Apenas {product.stock} em estoque
                          </Text>
                        )}
                      </VStack>
                    </Flex>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogBody>

        <DialogFooter
          display="flex"
          flexDirection="column"
          gap="4"
          bg="white"
          borderTopWidth="1px"
          p="4"
        >
          {/* Total */}
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

          {/* Aviso de estoque insuficiente */}
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

          {/* Botões */}
          <Flex gap="3" width="full" direction="column">
            {!isEmpty && (
              <Box w="full">
                <WhatsAppCheckoutButton
                  cart={cartItems}
                  buttonText="Finalizar pelo WhatsApp"
                  size="lg"
                  disabled={!canCheckout}
                  onSuccess={(total: number) => {
                    console.log("Pedido finalizado! Total:", total);
                    onClose();
                  }}
                />
              </Box>
            )}

            <Button variant="outline" onClick={onClose} size="lg" w="full">
              Continuar Comprando
            </Button>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
