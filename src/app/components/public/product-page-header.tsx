"use client";

import { Box, Flex, Image } from "@chakra-ui/react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerNav, type NavItem, NavMenu } from "storybook-react";
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
        <Flex
          as="header"
          position="fixed"
          top={0}
          left={0}
          zIndex={1000}
          w="100%"
          h={{ base: "50px", md: "60px" }}
          align="center"
          px={{ base: "10px", md: "20px" }}
          boxSizing="border-box"
          bg="inherit"
        >
          {logoSrc ? (
            <Image
              alt="Logo"
              src={logoSrc}
              maxW="100px"
              h="auto"
              position={{ base: "absolute", md: "static" }}
              left={{ base: "50%", md: "auto" }}
              transform={{ base: "translateX(-50%)", md: "none" }}
            />
          ) : null}
          <Box display={{ base: "block", md: "none" }}>
            <DrawerNav items={navItems} />
          </Box>
          <Box
            display={{ base: "none", md: "flex" }}
            flex="1"
            justifyContent="center"
          >
            <NavMenu items={navItems} />
          </Box>
        </Flex>

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
