import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { calculateInstallment, formatPrice } from "@/app/utils/price-formatter";
import { toaster } from "@/components/ui/toaster";
import type { ProductSize } from "@/core/entities";
import { useCartContext } from "../../contexts/cart-context";
import { ProductQuantitySelector } from "./product-quantity-selector";
import { ProductSizeSelector } from "./product-size-selector";
import { WhatsAppCheckoutButton } from "./whatsapp-checkout-button";

interface ProductInfoProps {
  /**
   * ID do produto no Firestore
   */
  productId: string;

  title: string;
  price: number;
  description: string;
  sizes: string[];
  availableSizes?: string[];
  maxQuantity?: number;

  /**
   * Estoque disponível do produto
   */
  stock: number;
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
}: ProductInfoProps) => {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartContext();

  const formattedPrice = formatPrice(price);
  const formattedInstallment = calculateInstallment(price, 6);

  /**
   * Valida se pode finalizar a compra
   */
  const canCheckout = useMemo(() => {
    // Tamanho deve estar selecionado (se houver tamanhos)
    const hasSizeSelected = sizes.length === 0 || selectedSize !== null;

    // Quantidade deve ser válida e não exceder estoque
    const hasValidQuantity = quantity > 0 && quantity <= stock;

    return hasSizeSelected && hasValidQuantity;
  }, [sizes.length, selectedSize, quantity, stock]);

  /**
   * Mensagem de erro para o botão desabilitado
   */
  const disabledReason = useMemo(() => {
    if (sizes.length > 0 && !selectedSize) {
      return "Selecione um tamanho";
    }
    if (quantity <= 0) {
      return "Quantidade inválida";
    }
    if (quantity > stock) {
      return `Estoque insuficiente (disponível: ${stock})`;
    }
    return "";
  }, [sizes.length, selectedSize, quantity, stock]);

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
    // Validação
    if (sizes.length > 0 && !selectedSize) {
      toaster.create({
        title: "Selecione um tamanho",
        type: "warning",
      });
      return;
    }

    if (quantity > stock) {
      toaster.create({
        title: "Estoque insuficiente",
        description: `Apenas ${stock} ${stock === 1 ? "unidade disponível" : "unidades disponíveis"}`,
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
    });

    // Abrir carrinho
    openCart();
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
        <ProductQuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          max={Math.min(maxQuantity, stock)} // Limita pela quantidade em estoque
        />

        {/* Aviso de estoque baixo */}
        {stock <= 5 && stock > 0 && (
          <Text fontSize="sm" color="orange.600" mt="2">
            Apenas {stock}{" "}
            {stock === 1 ? "unidade disponível" : "unidades disponíveis"}
          </Text>
        )}

        {/* Aviso de sem estoque */}
        {stock === 0 && (
          <Text fontSize="sm" color="red.600" mt="2" fontWeight="semibold">
            ❌ Produto fora de estoque
          </Text>
        )}
      </Box>

      {/* Aviso quando quantidade excede estoque */}
      {quantity > stock && stock > 0 && (
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
            , mas temos apenas <strong>{stock}</strong>{" "}
            {stock === 1 ? "disponível" : "disponíveis"} em estoque.
          </Text>
          <Text fontSize="sm" color="red.600" mt="2">
            Por favor, ajuste a quantidade ou entre em contato para verificar
            disponibilidade.
          </Text>
        </Box>
      )}

      {/* Aviso de tamanho não selecionado */}
      {sizes.length > 0 && !selectedSize && (
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
        <HStack gap="2" w="full">
          <Button
            flex="1"
            size="lg"
            onClick={handleAddToCart}
            disabled={!canCheckout}
            colorScheme="gray"
            variant="outline"
          >
            <FiShoppingCart style={{ marginRight: "8px" }} />
            Adicionar ao Carrinho
          </Button>

          <Box flex="1">
            <WhatsAppCheckoutButton
              cart={cart}
              onSuccess={handleSuccess}
              onError={handleError}
              disabled={!canCheckout}
              buttonText="Comprar Direto"
            />
          </Box>
        </HStack>

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
