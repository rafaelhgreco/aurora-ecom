"use client";

import { Box, Flex, Image } from "@chakra-ui/react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DrawerNav, type NavItem } from "storybook-react";
import { useScrollDirection } from "@/app/hooks/use-scroll-direction";
import { useSections } from "@/app/hooks/use-sections";
import { useCart } from "../../hooks/use-cart";
import { CartDrawer } from "../cart/cart-drawer";
import { CartIcon } from "../cart/cart-icon";
import { DesktopNav } from "./desktop-nav";

interface ProductPageHeaderProps {
  logoSrc: string;
}

function HeaderLogoLink({ logoSrc }: { logoSrc: string }) {
  if (!logoSrc) return null;
  return (
    <Link
      to="/"
      aria-label="Ir para a página inicial"
      style={{ textDecoration: "none" }}
    >
      <Box as="span" lineHeight={0} cursor="pointer" display="block">
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
  );
}

function usePublicHeaderNavItems(): NavItem[] {
  const navigate = useNavigate();
  const { sections } = useSections();

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
            ...sections.map((section) => ({
              id: `shop-${section.slug}`,
              label: section.name,
              onClick: () => navigate(`/loja/${section.slug}`),
            })),
          ],
        },
        { label: "Sobre", path: "/sobre" },
        { label: "Arquivo", path: "/arquivo" },
      ] satisfies NavItem[],
    [navigate, sections],
  );
}

export function ProductPageHeader({ logoSrc }: ProductPageHeaderProps) {
  const navItems = usePublicHeaderNavItems();
  const hidden = useScrollDirection();

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

  const logoLink = <HeaderLogoLink logoSrc={logoSrc} />;

  /**
   * Aplicado diretamente em cada elemento position:fixed (nunca num
   * ancestral comum) — um `transform` num ancestral vira o *containing
   * block* dos descendentes fixed, prendendo o dropdown do Shop e o
   * overlay/drawer mobile (do pacote externo) dentro de um contexto de
   * empilhamento local em vez de escaparem para o topo da página.
   */
  const hideOnScrollCss = {
    transform: hidden ? "translateY(-100%)" : "translateY(0)",
    transition: "transform 0.3s ease",
    willChange: "transform",
  };

  return (
    <>
      <Box>
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          zIndex={1000}
          css={hideOnScrollCss}
        >
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
                "& .public-header-mobile-nav > button svg": {
                  color: "#1a202c !important",
                },
                "& .public-header-mobile-nav > button:hover, & .public-header-mobile-nav > button:focus":
                  {
                    backgroundColor: "rgba(0, 0, 0, 0.06) !important",
                  },
                "& .public-header-mobile-nav > button:hover svg, & .public-header-mobile-nav > button:focus svg":
                  {
                    color: "#1a202c !important",
                  },
                "& .public-header-mobile-nav > div:nth-of-type(2) li": {
                  color: "#1a202c !important",
                },
                "& .public-header-mobile-nav > div:nth-of-type(2) li:hover": {
                  color: "#1a202c !important",
                  backgroundColor: "rgba(0, 0, 0, 0.04) !important",
                },
                "& .public-header-mobile-nav > div:nth-of-type(2) button:hover svg, & .public-header-mobile-nav > div:nth-of-type(2) button:focus svg":
                  {
                    color: "#1a202c !important",
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
              <Flex
                display={{ base: "flex", md: "none" }}
                align="center"
                w="full"
                minW={0}
                flexShrink={0}
              >
                <Box
                  flex="0 0 auto"
                  minW="44px"
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-start"
                  className="public-header-mobile-nav"
                >
                  <DrawerNav items={navItems} />
                </Box>
                <Flex flex="1" minW={0} justify="center" align="center" px="1">
                  {logoLink}
                </Flex>
                <Box
                  aria-hidden
                  flex="0 0 auto"
                  w={{ base: "56px", md: "0" }}
                  minW={{ base: "56px", md: "0" }}
                  flexShrink={0}
                />
              </Flex>

              <Flex
                display={{ base: "none", md: "flex" }}
                align="center"
                w="full"
                flex="1"
                minW={0}
              >
                <Box flexShrink={0}>
                  <HeaderLogoLink logoSrc={logoSrc} />
                </Box>
                <Box flex="1" display="flex" justifyContent="center" minW={0}>
                  <DesktopNav items={navItems} />
                </Box>
              </Flex>
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
          css={hideOnScrollCss}
        >
          <Box pointerEvents="auto">
            <CartIcon itemCount={itemCount} onClick={openCart} size="md" />
          </Box>
        </Flex>
      </Box>

      {/* Reserva o espaço do header fixo no fluxo normal — sem isso, o
          conteúdo da página começa por baixo do header. */}
      <Box aria-hidden h={{ base: "50px", md: "60px" }} flexShrink={0} />

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
