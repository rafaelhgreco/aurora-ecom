import {
  Box,
  Button,
  type ButtonProps,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiShoppingCart } from "react-icons/fi";
import { formatPrice } from "@/app/utils/price-formatter";
import { toaster } from "@/components/ui/toaster";
import type { ProductSize } from "@/core/entities";
import type { ProductColorVariant } from "@/core/schemas/product.schema";
import { useCart } from "../../hooks/use-cart";
import { ProductColorSelector } from "./product-color-selector";
import { ProductQuantitySelector } from "./product-quantity-selector";
import { ProductSizeSelector } from "./product-size-selector";
import { ProductUnavailableNotice } from "./product-unavailable-notice";
import { ShareProductButton } from "./share-product-button";
import { WhatsAppProductInquiryButton } from "./whatsapp-checkout-button";

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
  slug: string;
  title: string;
  price: number;
  /** Preço de tabela, quando há promoção ativa (exibido riscado ao lado de `price`). */
  originalPrice?: number | null;
  description: string;
  sizes: string[];
  availableSizes?: string[];
  maxQuantity?: number;
  stock: number;
  /** Estoque por tamanho; quando presente, stock efetivo depende do tamanho selecionado */
  stockBySize?: Partial<Record<string, number>>;
  /** false = pausado na vitrine; não permite compra nem carrinho */
  isActive?: boolean;
  /** Variantes com fotos; exibidas na página; escolha obrigatória só com mais de uma */
  colorVariants?: ProductColorVariant[];
  selectedColor?: string;
  onColorChange?: (color: string) => void;
}

export const ProductInfo = ({
  productId,
  slug,
  title,
  price,
  originalPrice,
  description,
  sizes,
  availableSizes,
  maxQuantity = 10,
  stock,
  stockBySize,
  isActive = true,
  colorVariants = [],
  selectedColor = "",
  onColorChange,
}: ProductInfoProps) => {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart, itemCount } = useCart();

  // biome-ignore lint/correctness/useExhaustiveDependencies: ao mudar a cor (prop), limpar tamanho
  useEffect(() => {
    setSelectedSize(null);
  }, [selectedColor]);

  const effectiveStock =
    stockBySize && selectedSize ? (stockBySize[selectedSize] ?? 0) : stock;

  /** Pausado pelo admin, ou totalmente sem estoque — sem opções de compra */
  const isProductUnavailable = !isActive || stock === 0;

  useEffect(() => {
    if (quantity > effectiveStock) {
      setQuantity(Math.max(1, effectiveStock));
    }
  }, [effectiveStock, quantity]);

  const formattedPrice = formatPrice(price);

  /**
   * Valida se pode finalizar a compra
   */
  const needsColorChoice = colorVariants.length > 1;
  const colorOk =
    !needsColorChoice || (selectedColor !== "" && Boolean(selectedColor));

  const canCheckout = useMemo(() => {
    if (isProductUnavailable) {
      return false;
    }

    const hasSizeSelected = sizes.length === 0 || selectedSize !== null;
    const hasValidQuantity = quantity > 0 && quantity <= effectiveStock;

    return hasSizeSelected && hasValidQuantity && colorOk;
  }, [
    isProductUnavailable,
    sizes.length,
    selectedSize,
    quantity,
    effectiveStock,
    colorOk,
  ]);

  /**
   * Mensagem de erro para o botão desabilitado
   */
  const disabledReason = useMemo(() => {
    if (needsColorChoice && !selectedColor) {
      return "Selecione uma cor";
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
  }, [
    sizes.length,
    selectedSize,
    quantity,
    effectiveStock,
    needsColorChoice,
    selectedColor,
  ]);

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
    if (isProductUnavailable) {
      toaster.create({
        title: "Indisponível",
        description: "Este produto não está à venda no momento.",
        type: "warning",
      });
      return;
    }

    // Validação
    if (needsColorChoice && !selectedColor) {
      toaster.create({
        title: "Selecione uma cor",
        type: "warning",
      });
      return;
    }

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
    const passColor = needsColorChoice;

    const cartVariants: { size?: ProductSize; color?: string } = {};
    if (selectedSize) cartVariants.size = selectedSize;
    if (passColor && selectedColor) cartVariants.color = selectedColor;

    addItem(
      productId,
      quantity,
      Object.keys(cartVariants).length > 0 ? cartVariants : undefined,
    );

    // Mostrar sucesso
    const colorPart =
      passColor && selectedColor ? ` - Cor ${selectedColor}` : "";
    toaster.create({
      title: "Produto adicionado ao carrinho!",
      description: `${quantity}x ${title}${selectedSize ? ` - Tamanho ${selectedSize}` : ""}${colorPart}`,
      type: "success",
      closable: true,
      duration: 4000,
    }); // Não abrir carrinho automaticamente
  };

  return (
    <VStack align="start" gap="6" w="full">
      <Box w="full">
        <Flex justify="space-between" align="start" gap="2">
          <Heading as="h1" size="xl" fontWeight="medium" mb="2">
            {title}
          </Heading>
          <ShareProductButton title={title} text={`Confira: ${title}`} />
        </Flex>
        <HStack align="baseline" gap="2">
          {originalPrice != null && (
            <Text fontSize="lg" color="gray.400" textDecoration="line-through">
              {formatPrice(originalPrice)}
            </Text>
          )}
          <Text fontSize="2xl" fontWeight="semibold" color="gray.900">
            {formattedPrice}
          </Text>
        </HStack>
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

      {colorVariants.length > 0 && onColorChange && (
        <ProductColorSelector
          variants={colorVariants}
          selectedColor={selectedColor || colorVariants[0]?.color || ""}
          onColorChange={onColorChange}
          disabled={isProductUnavailable}
        />
      )}

      {sizes.length > 0 && (
        <Box w="full">
          <Text fontWeight="semibold" mb="3" textTransform="uppercase">
            Tamanho
          </Text>
          <ProductSizeSelector
            sizes={sizes}
            selectedSize={selectedSize}
            onSizeChange={handleSizeChange}
            availableSizes={availableSizes}
            disabled={isProductUnavailable}
          />
        </Box>
      )}

      {!isProductUnavailable && (
        <Box w="full">
          <Text fontWeight="semibold" mb="3" textTransform="uppercase">
            Quantidade
          </Text>
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
        </Box>
      )}

      {/* Aviso quando quantidade excede estoque */}
      {!isProductUnavailable &&
        quantity > effectiveStock &&
        effectiveStock > 0 && (
          <Box
            w="full"
            p="4"
            bg="red.50"
            borderRadius="md"
            borderWidth="1px"
            borderColor="red.200"
          >
            <HStack gap="1" color="red.700" mb="1">
              <FiAlertTriangle size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                Estoque Insuficiente
              </Text>
            </HStack>
            <Text fontSize="sm" color="red.600">
              Você selecionou {quantity}{" "}
              {quantity === 1 ? "unidade" : "unidades"}, mas temos apenas{" "}
              <strong>{effectiveStock}</strong>{" "}
              {effectiveStock === 1 ? "disponível" : "disponíveis"} em estoque.
            </Text>
            <Text fontSize="sm" color="red.600" mt="2">
              Por favor, ajuste a quantidade ou entre em contato para verificar
              disponibilidade.
            </Text>
          </Box>
        )}

      {/* Aviso de tamanho não selecionado */}
      {!isProductUnavailable && sizes.length > 0 && !selectedSize && (
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

      {isProductUnavailable ? (
        <ProductUnavailableNotice
          productSlug={slug}
          productTitle={title}
          ctaLayout={PRODUCT_CTA_LAYOUT}
        />
      ) : (
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
              <WhatsAppProductInquiryButton
                productSlug={slug}
                productTitle={title}
                buttonProps={{
                  ...PRODUCT_CTA_LAYOUT,
                  _hover: {
                    transform: "translateY(-2px)",
                    shadow: "md",
                    bg: "#20BD5A",
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
      )}
    </VStack>
  );
};
