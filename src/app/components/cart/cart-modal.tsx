"use client";

/**
 * Component: CartModal (Dumb Component)
 * Modal do carrinho - apenas UI, sem lógica de negócio
 * Responsivo: usa CartModalMobile para mobile e CartModalDesktop para desktop
 */

import { useMediaQuery } from "@chakra-ui/react";
import type { ProductSize } from "@/core/entities";
import type { EnrichedCartItem } from "../../hooks/use-cart";
import type { CartItemJSON } from "../../types/checkout";
import { CartModalDesktop } from "./cart-modal-desktop";
import { CartModalMobile } from "./cart-modal-mobile";

interface CartModalProps {
  /**
   * Controla visibilidade do modal
   */
  isOpen: boolean;

  /**
   * Callback ao fechar modal
   */
  onClose: () => void;

  /**
   * Itens enriquecidos do carrinho
   */
  items: EnrichedCartItem[];

  /**
   * Total do carrinho (formatado)
   */
  total: string;

  /**
   * Está carregando produtos?
   */
  loading?: boolean;

  /**
   * Callback ao remover item
   */
  onRemoveItem: (itemKey: string) => void;

  /**
   * Callback ao atualizar quantidade
   */
  onUpdateQuantity: (itemKey: string, quantity: number) => void;

  /**
   * Callback ao atualizar tamanho
   */
  onUpdateSize: (itemKey: string, size: ProductSize) => void;

  /**
   * Callback ao limpar carrinho
   */
  onClearCart: () => void;

  /**
   * Cart items para WhatsApp
   */
  cartItems: CartItemJSON[];

  /**
   * Pode fazer checkout? (validação de estoque)
   */
  canCheckout?: boolean;

  /**
   * Motivo pelo qual o checkout está bloqueado
   */
  checkoutBlockReason?: string;
}

export function CartModal({
  isOpen,
  onClose,
  items,
  total,
  loading = false,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateSize,
  onClearCart,
  cartItems,
  canCheckout = true,
  checkoutBlockReason = "",
}: CartModalProps) {
  // Define o breakpoint para mobile (768px)
  const [isMobile] = useMediaQuery(["(max-width: 768px)"]);

  if (isMobile) {
    return (
      <CartModalMobile
        isOpen={isOpen}
        onClose={onClose}
        items={items}
        total={total}
        loading={loading}
        onRemoveItem={onRemoveItem}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateSize={onUpdateSize}
        onClearCart={onClearCart}
        cartItems={cartItems}
        canCheckout={canCheckout}
        checkoutBlockReason={checkoutBlockReason}
      />
    );
  }

  return (
    <CartModalDesktop
      isOpen={isOpen}
      onClose={onClose}
      items={items}
      total={total}
      loading={loading}
      onRemoveItem={onRemoveItem}
      onUpdateQuantity={onUpdateQuantity}
      onUpdateSize={onUpdateSize}
      onClearCart={onClearCart}
      cartItems={cartItems}
      canCheckout={canCheckout}
      checkoutBlockReason={checkoutBlockReason}
    />
  );
}
