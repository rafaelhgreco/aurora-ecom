"use client";

/**
 * Component: CartIcon
 * Ícone do carrinho com badge de quantidade
 */

import { Box, IconButton } from "@chakra-ui/react";
import { FiShoppingCart } from "react-icons/fi";

interface CartIconProps {
  /**
   * Quantidade de itens no carrinho
   */
  itemCount: number;

  /**
   * Callback ao clicar no ícone
   */
  onClick: () => void;

  /**
   * Tamanho do ícone
   */
  size?: "sm" | "md" | "lg";
}

export function CartIcon({ itemCount, onClick, size = "md" }: CartIconProps) {
  const badgeSize = size === "sm" ? "16px" : size === "md" ? "18px" : "20px";
  const badgeFontSize =
    size === "sm" ? "10px" : size === "md" ? "11px" : "12px";

  return (
    <Box position="relative" display="inline-block" p="2">
      <IconButton
        aria-label="Abrir carrinho"
        onClick={onClick}
        variant="ghost"
        size={size}
        _hover={{ bg: "gray.100" }}
        borderRadius="full"
      >
        <FiShoppingCart size={size === "sm" ? 18 : size === "md" ? 20 : 24} />
      </IconButton>

      {/* Badge de quantidade */}
      <Box
        position="absolute"
        top="2px"
        right="2px"
        bg={itemCount > 0 ? "red.500" : "gray.400"}
        color="white"
        borderRadius="full"
        width={badgeSize}
        height={badgeSize}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize={badgeFontSize}
        fontWeight="bold"
        pointerEvents="none"
        transition="all 0.2s"
        transform={itemCount > 0 ? "scale(1)" : "scale(0.9)"}
      >
        {itemCount > 99 ? "99+" : itemCount}
      </Box>
    </Box>
  );
}
