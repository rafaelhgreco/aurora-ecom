"use client";

/**
 * Component: ProductPageHeader
 * Header da página de produto com carrinho
 */

import { Box, Flex } from "@chakra-ui/react";
import { Header } from "storybook-react";
import { useCart } from "../../hooks/use-cart";
import { CartIcon } from "../cart/cart-icon";
import { CartModal } from "../cart/cart-modal";

interface ProductPageHeaderProps {
  /**
   * Logo source
   */
  logoSrc: string;
}

export function ProductPageHeader({ logoSrc }: ProductPageHeaderProps) {
  const {
    isOpen,
    openCart,
    closeCart,
    enrichedItems,
    total,
    loading,
    removeItem,
    updateItemQuantity,
    updateItemSize,
    clearCart,
    toWhatsAppCartItems,
    itemCount,
    canCheckout,
  } = useCart();

  return (
    <>
      <Box>
        <Header
          logo={logoSrc}
          items={[
            { label: "SHOP", path: "/" },
            { label: "ARQUIVO", path: "/arquivo" },
            { label: "SOBRE", path: "/sobre" },
          ]}
        />

        <Flex
          position="fixed"
          top="3px"
          right="0"
          h={{ base: "50px", md: "60px" }}
          px={{ base: "4", md: "6" }}
          align="center"
          zIndex="1050"
          pointerEvents="none"
        >
          <Box pointerEvents="auto">
            <CartIcon itemCount={itemCount} onClick={openCart} size="md" />
          </Box>
        </Flex>
      </Box>

      <CartModal
        isOpen={isOpen}
        onClose={closeCart}
        items={enrichedItems}
        total={total}
        loading={loading}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateItemQuantity}
        onUpdateSize={updateItemSize}
        onClearCart={clearCart}
        cartItems={toWhatsAppCartItems()}
        canCheckout={canCheckout}
      />
    </>
  );
}
