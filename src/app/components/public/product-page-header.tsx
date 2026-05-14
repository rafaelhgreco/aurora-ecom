"use client";

import { Box, Flex, Image } from "@chakra-ui/react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
          label: "Shop",
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
        { label: "Arquivo", path: "/arquivo" },
        { label: "Sobre", path: "/sobre" },
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
        <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
          <Box
            position="relative"
            w="100%"
            css={{
              "--header-blur": "8px",
              "--header-opacity": "0.38",
              "@media screen and (min-width: 990px)": {
                "--header-blur": "10px",
                "--header-opacity": "0.25",
              },
            }}
          >
            <Box
              aria-hidden
              position="absolute"
              top={0}
              left={0}
              right={0}
              h={{ base: "50px", md: "60px" }}
              zIndex={0}
              pointerEvents="none"
              borderBottomLeftRadius="24px"
              borderBottomRightRadius="24px"
              overflow="hidden"
              bg="transparent"
              css={{
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "-60%",
                  left: "-15%",
                  width: "min(70vw, 520px)",
                  height: "220%",
                  background:
                    "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(89, 50, 230, 0.45) 0%, rgba(89, 50, 230, 0.08) 45%, transparent 72%)",
                  filter: "blur(32px)",
                  opacity: 0.85,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: "-50%",
                  right: "-20%",
                  width: "min(55vw, 420px)",
                  height: "200%",
                  background:
                    "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(224, 50, 230, 0.28) 0%, rgba(134, 50, 230, 0.1) 40%, transparent 70%)",
                  filter: "blur(28px)",
                  opacity: 0.9,
                },
              }}
            />
            <Box
              aria-hidden
              position="absolute"
              top={0}
              left={0}
              right={0}
              h={{ base: "50px", md: "60px" }}
              zIndex={1}
              pointerEvents="none"
              borderBottomLeftRadius="24px"
              borderBottomRightRadius="24px"
              borderBottom="1px solid"
              borderColor="rgba(255, 255, 255, 0.22)"
              boxShadow="0 12px 40px rgba(15, 23, 42, 0.08), 0 0 60px rgba(89, 50, 230, 0.06)"
              css={{
                backdropFilter: "blur(var(--header-blur))",
                WebkitBackdropFilter: "blur(var(--header-blur))",
                backgroundColor: "rgb(255 255 255 / var(--header-opacity))",
              }}
            />
            <Flex
              as="header"
              position="relative"
              zIndex={2}
              w="100%"
              h={{ base: "50px", md: "60px" }}
              align="center"
              px={{ base: "10px", md: "20px" }}
              boxSizing="border-box"
              bg="transparent"
              css={{
                "& nav ul[data-dropdown-open]": {
                  zIndex: 60,
                },
                "& nav ul[data-dropdown-open='true']": {
                  backdropFilter: "blur(var(--header-blur))",
                  WebkitBackdropFilter: "blur(var(--header-blur))",
                  backgroundColor: "rgb(255 255 255 / 0.72)",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.45)",
                  boxShadow:
                    "0 12px 36px rgba(15, 23, 42, 0.12), 0 0 48px rgba(89, 50, 230, 0.18), 0 0 36px rgba(224, 50, 230, 0.12)",
                },
                "& .public-header-mobile-nav > div:nth-of-type(2)": {
                  backdropFilter: "blur(var(--header-blur))",
                  WebkitBackdropFilter: "blur(var(--header-blur))",
                  backgroundColor: "rgb(255 255 255 / 0.78) !important",
                  borderRight: "1px solid rgba(255, 255, 255, 0.35)",
                  boxShadow:
                    "4px 0 40px rgba(15, 23, 42, 0.1), 0 0 48px rgba(89, 50, 230, 0.15), inset 0 0 60px rgba(224, 50, 230, 0.06)",
                },
              }}
            >
              {logoSrc ? (
                <Link
                  to="/"
                  aria-label="Ir para a página inicial"
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    as="span"
                    display={{ base: "block", md: "inline-block" }}
                    position={{ base: "absolute", md: "static" }}
                    left={{ base: "50%", md: "auto" }}
                    transform={{ base: "translateX(-50%)", md: "none" }}
                    zIndex={3}
                    lineHeight={0}
                    cursor="pointer"
                  >
                    <Image
                      alt=""
                      src={logoSrc}
                      maxW="100px"
                      h="auto"
                      display="block"
                      draggable={false}
                    />
                  </Box>
                </Link>
              ) : null}
              <Box
                display={{ base: "block", md: "none" }}
                className="public-header-mobile-nav"
              >
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
          </Box>
        </Box>

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
