import {
  Box,
  Button,
  type ButtonProps,
  Flex,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { calculateInstallment, formatPrice } from "@/app/utils/price-formatter";
import { toaster } from "@/components/ui/toaster";
import type { ProductSize } from "@/core/entities";
import { useCart } from "../../hooks/use-cart";
import { ProductQuantitySelector } from "./product-quantity-selector";
import { ProductSizeSelector } from "./product-size-selector";
import { WhatsAppCheckoutButton } from "./whatsapp-checkout-button";

/**
 * CTAs da página de produto — no mobile evita altura fixa para o texto
 * longo em maiúsculas (“Adicionar ao Carrinho”) caber sem cortar.
 */
const PRODUCT_CTA_LAYOUT: Partial<ButtonProps> = {
  h: { base: "auto", md: "60px" },
  minH: { md: "60px" },
  py: { base: "3", md: "0" },
  px: { base: "2", sm: "3", md: "4" },
  fontSize: { base: "xs", sm: "sm", md: "md" },
  textTransform: "uppercase",
  w: "full",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: { base: 2, md: 3 },
  flexWrap: { base: "wrap", md: "nowrap" },
  whiteSpace: { base: "normal", md: "nowrap" },
  lineHeight: { base: "1.25", md: "normal" },
  textAlign: "center",
};

interface ProductInfoProps {
  productId: string;
  title: string;
  price: number;
  description: string;
  sizes: string[];
  availableSizes?: string[];
  maxQuantity?: number;
  stock: number;
  /** Estoque por tamanho; quando presente, stock efetivo depende do tamanho selecionado */
  stockBySize?: Partial<Record<string, number>>;
  /** false = pausado na vitrine; não permite compra nem carrinho */
  isActive?: boolean;
}

export const ProductInfo = ({
  productId,
  title,
  price,
  description,
  sizes,
  availableSizes,
  maxQuantity = 10,
  stock,
  stockBySize,
  isActive = true,
}: ProductInfoProps) => {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart, itemCount } = useCart();

  const effectiveStock =
    stockBySize && selectedSize ? (stockBySize[selectedSize] ?? 0) : stock;

  useEffect(() => {
    if (quantity > effectiveStock) {
      setQuantity(Math.max(1, effectiveStock));
    }
  }, [effectiveStock, quantity]);

  const formattedPrice = formatPrice(price);
  const formattedInstallment = calculateInstallment(price, 6);

  /**
   * Valida se pode finalizar a compra
   */
  const canCheckout = useMemo(() => {
    if (!isActive) {
      return false;
    }

    const hasSizeSelected = sizes.length === 0 || selectedSize !== null;
    const hasValidQuantity = quantity > 0 && quantity <= effectiveStock;

    return hasSizeSelected && hasValidQuantity;
  }, [isActive, sizes.length, selectedSize, quantity, effectiveStock]);

  /**
   * Mensagem de erro para o botão desabilitado
   */
  const disabledReason = useMemo(() => {
    if (!isActive) {
      return "Produto indisponível no momento";
    }
    if (sizes.length > 0 && !selectedSize) {
      return "Selecione um tamanho";
    }
    if (quantity <= 0) {
      return "Quantidade inválida";
    }
    if (quantity > effectiveStock) {
      return `Estoque insuficiente (disponível: ${effectiveStock})`;
    }
    return "";
  }, [isActive, sizes.length, selectedSize, quantity, effectiveStock]);

  /**
   * Constrói o carrinho dinamicamente baseado nas seleções do usuário
   * Usa o formato esperado pela WhatsAppCheckoutButton
   */
  const cart = useMemo(() => {
    // Se não tiver tamanho selecionado, ainda cria o item sem variante
    const item = {
      productId,
      quantity,
      ...(selectedSize && {
        variants: {
          size: selectedSize,
        },
      }),
    };

    return [item];
  }, [productId, quantity, selectedSize]);

  const handleSuccess = (total: number) => {
    console.log("Pedido processado com sucesso! Total:", total);
  };

  const handleError = (error: string) => {
    console.error("Erro ao processar pedido:", error);
    // Aqui você pode mostrar um toast ou modal de erro
  };

  /**
   * Handler para mudança de tamanho com validação de tipo
   */
  const handleSizeChange = (size: string) => {
    setSelectedSize(size as ProductSize);
  };

  /**
   * Handler para adicionar ao carrinho
   */
  const handleAddToCart = () => {
    if (!isActive) {
      toaster.create({
        title: "Indisponível",
        description: "Este produto não está à venda no momento.",
        type: "warning",
      });
      return;
    }

    // Validação
    if (sizes.length > 0 && !selectedSize) {
      toaster.create({
        title: "Selecione um tamanho",
        type: "warning",
      });
      return;
    }

    if (quantity > effectiveStock) {
      toaster.create({
        title: "Estoque insuficiente",
        description: `Apenas ${effectiveStock} ${effectiveStock === 1 ? "unidade disponível" : "unidades disponíveis"}`,
        type: "error",
      });
      return;
    }

    // Adicionar ao carrinho
    addItem(
      productId,
      quantity,
      selectedSize ? { size: selectedSize } : undefined,
    );

    // Mostrar sucesso
    toaster.create({
      title: "Produto adicionado ao carrinho!",
      description: `${quantity}x ${title}${selectedSize ? ` - Tamanho ${selectedSize}` : ""}`,
      type: "success",
      closable: true,
      duration: 4000,
    }); // Não abrir carrinho automaticamente
  };

  return (
    <VStack align="start" gap="6" w="full">
      <Box>
        <Heading as="h1" size="xl" fontWeight="medium" mb="2">
          {title}
        </Heading>
        <Text fontSize="2xl" fontWeight="semibold" color="gray.900">
          {formattedPrice}
        </Text>
        <Text fontSize="sm" color="gray.600">
          ou em até 6x de {formattedInstallment}
        </Text>
      </Box>

      <Box w="full">
        <Text
          fontSize="md"
          color="gray.700"
          lineHeight="tall"
          whiteSpace="pre-line"
        >
          {description}
        </Text>
      </Box>

      {!isActive && (
        <Box
          w="full"
          p="4"
          bg="orange.50"
          borderRadius="md"
          borderWidth="1px"
          borderColor="orange.200"
        >
          <Text fontSize="sm" color="orange.900" fontWeight="semibold">
            Indisponível para compra
          </Text>
          <Text fontSize="sm" color="orange.800" mt={1}>
            Este produto está pausado na loja. Você pode ver os detalhes, mas
            não é possível adicionar ao carrinho nem finalizar pelo WhatsApp.
          </Text>
        </Box>
      )}

      <Box w="full">
        <Text fontWeight="semibold" mb="3" textTransform="uppercase">
          Tamanho
        </Text>
        <ProductSizeSelector
          sizes={sizes}
          selectedSize={selectedSize}
          onSizeChange={handleSizeChange}
          availableSizes={availableSizes}
        />
      </Box>

      <Box w="full">
        <Text fontWeight="semibold" mb="3" textTransform="uppercase">
          Quantidade
        </Text>
        {isActive ? (
          <>
            <ProductQuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
              max={Math.min(maxQuantity, effectiveStock)}
            />

            {/* Aviso de estoque baixo */}
            {effectiveStock <= 5 && effectiveStock > 0 && (
              <Text fontSize="sm" color="orange.600" mt="2">
                Apenas {effectiveStock}{" "}
                {effectiveStock === 1
                  ? "unidade disponível"
                  : "unidades disponíveis"}
              </Text>
            )}

            {/* Aviso de sem estoque */}
            {effectiveStock === 0 && (
              <Text fontSize="sm" color="red.600" mt="2" fontWeight="semibold">
                ❌ Produto fora de estoque
              </Text>
            )}
          </>
        ) : (
          <Text fontSize="sm" color="gray.600">
            Não é possível escolher quantidade enquanto o produto estiver
            indisponível.
          </Text>
        )}
      </Box>

      {/* Aviso quando quantidade excede estoque */}
      {isActive && quantity > effectiveStock && effectiveStock > 0 && (
        <Box
          w="full"
          p="4"
          bg="red.50"
          borderRadius="md"
          borderWidth="1px"
          borderColor="red.200"
        >
          <Text fontSize="sm" color="red.700" fontWeight="semibold" mb="1">
            ⚠️ Estoque Insuficiente
          </Text>
          <Text fontSize="sm" color="red.600">
            Você selecionou {quantity} {quantity === 1 ? "unidade" : "unidades"}
            , mas temos apenas <strong>{effectiveStock}</strong>{" "}
            {effectiveStock === 1 ? "disponível" : "disponíveis"} em estoque.
          </Text>
          <Text fontSize="sm" color="red.600" mt="2">
            Por favor, ajuste a quantidade ou entre em contato para verificar
            disponibilidade.
          </Text>
        </Box>
      )}

      {/* Aviso de tamanho não selecionado */}
      {isActive && sizes.length > 0 && !selectedSize && (
        <Box
          w="full"
          p="3"
          bg="yellow.50"
          borderRadius="md"
          borderWidth="1px"
          borderColor="yellow.200"
        >
          <Text fontSize="sm" color="yellow.700">
            Selecione um tamanho antes de finalizar
          </Text>
        </Box>
      )}

      <Box w="full">
        <VStack gap={{ base: 4, sm: 3 }} w="full">
          <Flex
            gap={{ base: 4, sm: 3 }}
            w="full"
            direction={{ base: "column", sm: "row" }}
            align="stretch"
          >
            <Button
              flex="1"
              {...PRODUCT_CTA_LAYOUT}
              onClick={handleAddToCart}
              disabled={!canCheckout}
              bg="black"
              color="white"
              _hover={{
                bg: "gray.800",
                transform: "translateY(-2px)",
                shadow: "md",
              }}
              _active={{ bg: "gray.900", transform: "translateY(0)" }}
            >
              <Box
                as="span"
                flexShrink={0}
                fontSize={{ base: "18px", sm: "20px", md: "20px" }}
                lineHeight="1"
                display="inline-flex"
                alignItems="center"
              >
                <FiShoppingCart />
              </Box>
              <Box as="span">Adicionar ao Carrinho</Box>
            </Button>

            {itemCount > 0 && (
              <Button
                flex="1"
                {...PRODUCT_CTA_LAYOUT}
                onClick={openCart}
                variant="outline"
                borderWidth="2px"
                borderColor="gray.200"
                color="gray.700"
                _hover={{
                  bg: "gray.50",
                  borderColor: "gray.300",
                  transform: "translateY(-2px)",
                  shadow: "sm",
                }}
                _active={{ transform: "translateY(0)" }}
              >
                Ir até o Carrinho ({itemCount})
              </Button>
            )}
          </Flex>
          <Box w="full">
            <WhatsAppCheckoutButton
              cart={cart}
              onSuccess={handleSuccess}
              onError={handleError}
              disabled={!canCheckout}
              buttonText="Comprar Direto"
              buttonProps={{
                ...PRODUCT_CTA_LAYOUT,
                _hover: {
                  transform: "translateY(-2px)",
                  shadow: "md",
                },
                _active: { transform: "translateY(0)" },
              }}
            />
          </Box>
        </VStack>

        {/* Mensagem de ajuda quando botão desabilitado */}
        {!canCheckout && disabledReason && (
          <Text fontSize="sm" color="gray.600" mt="2" textAlign="center">
            {disabledReason}
          </Text>
        )}
      </Box>
    </VStack>
  );
};
