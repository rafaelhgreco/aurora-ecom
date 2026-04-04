"use client";

/**
 * Component: ProductPageHeader
 * Header da página de produto com carrinho.
 * Navegação: SHOP agrupa subitens (dropdown + drawer) via API do storybook-react.
 */

import { Box, Flex } from "@chakra-ui/react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header, type NavItem } from "storybook-react";
import { SHOP_CATALOG_ROUTES } from "@/core/catalog/shop-catalog";
import { useCart } from "../../hooks/use-cart";
import { CartDrawer } from "../cart/cart-drawer";
import { CartIcon } from "../cart/cart-icon";

interface ProductPageHeaderProps {
  logoSrc: string;
}

function usePublicHeaderNavItems(): NavItem[] {
  const navigate = useNavigate();

  return useMemo(
    () =>
      [
        {
          label: "SHOP",
          isButton: true as const,
          dropdownItems: [
            {
              id: "shop-hub",
              label: "Shop",
              onClick: () => navigate("/loja"),
            },
            ...SHOP_CATALOG_ROUTES.map((route) => ({
              id: `shop-${route.slug}`,
              label: route.title,
              onClick: () => navigate(`/loja/${route.slug}`),
            })),
          ],
        },
        { label: "ARQUIVO", path: "/arquivo" },
        { label: "SOBRE", path: "/sobre" },
      ] satisfies NavItem[],
    [navigate],
  );
}

export function ProductPageHeader({ logoSrc }: ProductPageHeaderProps) {
  const navItems = usePublicHeaderNavItems();

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
    updateItemColor,
    clearCart,
    toWhatsAppCartItems,
    itemCount,
    canCheckout,
    checkoutBlockReason,
  } = useCart();

  return (
    <>
      <Box>
        <Header logo={logoSrc} items={navItems} />

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

      <CartDrawer
        isOpen={isOpen}
        onClose={closeCart}
        items={enrichedItems}
        total={total}
        loading={loading}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateItemQuantity}
        onUpdateSize={updateItemSize}
        onUpdateColor={updateItemColor}
        onClearCart={clearCart}
        cartItems={toWhatsAppCartItems()}
        canCheckout={canCheckout}
        checkoutBlockReason={checkoutBlockReason ?? ""}
      />
    </>
  );
}
