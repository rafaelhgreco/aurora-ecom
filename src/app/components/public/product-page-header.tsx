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
    checkoutBlockReason,
  } = useCart();

  return (
    <>
      <Flex align="center" justify="space-between" w="full" px="4">
        <Box flex="1">
          <Header
            logo={logoSrc}
            items={[
              { label: "SHOP", path: "/" },
              { label: "ARQUIVO", path: "/dashboard" },
              { label: "SOBRE", path: "/sobre" },
            ]}
          />
        </Box>
        <CartIcon itemCount={itemCount} onClick={openCart} size="lg" />
      </Flex>

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
        checkoutBlockReason={checkoutBlockReason}
      />
    </>
  );
}
