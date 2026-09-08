"use client";

import { Box, Button, type ButtonProps } from "@chakra-ui/react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { createWhatsAppCheckoutLink } from "@/app/actions/checkout";
import type { CartItemJSON } from "@/app/types/checkout";
import { CHECKOUT_GENERIC } from "@/shared/errors/client-error-messages";

const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_GREEN_HOVER = "#20BD5A";
const WHATSAPP_GREEN_ACTIVE = "#1DA851";

type WhatsAppButtonStyleProps = Omit<
  ButtonProps,
  "onClick" | "children" | "loading" | "loadingText" | "spinner"
>;

/** Número da loja (mesmo uso do checkout no servidor) — precisa estar no cliente para o link de dúvidas. */
const SHOP_WHATSAPP =
  process.env.NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER ?? "5511999999999";

function buildProductInquiryMessage(
  productTitle: string,
  productPageUrl: string,
  unavailable: boolean,
) {
  return [
    "Olá! Gostaria de mais informações sobre o produto:",
    "",
    `*${productTitle}*`,
    "",
    `Link: ${productPageUrl}`,
    ...(unavailable
      ? [
          "",
          "Vi que esse produto está indisponível/sem estoque no momento e gostaria de saber mais.",
        ]
      : []),
  ].join("\n");
}

// --- Carrinho: finalizar pedido pelo WhatsApp (inalterado para o drawer) ---

interface WhatsAppCheckoutButtonProps {
  cart: CartItemJSON[];
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  buttonText?: string;
  disabled?: boolean;
  onSuccess?: (total: number) => void;
  onError?: (error: string) => void;
  buttonProps?: WhatsAppButtonStyleProps;
}

export function WhatsAppCheckoutButton({
  cart,
  variant = "solid",
  size = "lg",
  buttonText = "Finalizar pelo WhatsApp",
  disabled = false,
  onSuccess,
  onError,
  buttonProps,
}: WhatsAppCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Carrinho vazio. Adicione produtos antes de finalizar.");
      return;
    }

    const confirmed = confirm(
      `Você será redirecionado para o WhatsApp para finalizar seu pedido de ${cart.length} ${cart.length === 1 ? "item" : "itens"}.\n\nDeseja continuar?`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const result = await createWhatsAppCheckoutLink(cart);

      if (result.success && result.url) {
        if (result.total) {
          onSuccess?.(result.total);
        }
        window.open(result.url, "_blank");
        return;
      }

      const message = result.error || CHECKOUT_GENERIC;
      alert(`Erro: ${message}`);
      onError?.(message);
    } catch {
      alert(`Erro: ${CHECKOUT_GENERIC}`);
      onError?.(CHECKOUT_GENERIC);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={2}
      {...(size && !buttonProps?.h ? { size } : {})}
      colorScheme="green"
      width="full"
      {...buttonProps}
      disabled={disabled || cart.length === 0}
      loading={loading}
      onClick={handleCheckout}
    >
      <Box
        as="span"
        aria-hidden
        flexShrink={0}
        fontSize={{ base: "18px", sm: "20px", md: "20px" }}
        lineHeight="1"
        display="inline-flex"
        alignItems="center"
      >
        <FaWhatsapp />
      </Box>
      {buttonText}
    </Button>
  );
}

// --- Página de produto: pedir mais informações + link do produto ---

export interface WhatsAppProductInquiryButtonProps {
  productSlug: string;
  productTitle: string;
  /** true quando o produto está pausado/sem estoque — ajusta a mensagem pré-preenchida */
  unavailable?: boolean;
  /** Estilo alinhado aos outros CTAs (ex.: PRODUCT_CTA_LAYOUT) */
  buttonProps?: WhatsAppButtonStyleProps;
}

/**
 * Abre o WhatsApp com mensagem pedindo mais informações e o link público do produto.
 * Visual nas cores oficiais do WhatsApp.
 */
export function WhatsAppProductInquiryButton({
  productSlug,
  productTitle,
  unavailable = false,
  buttonProps,
}: WhatsAppProductInquiryButtonProps) {
  const openInquiry = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const productPageUrl = `${origin}/produto/${encodeURIComponent(productSlug)}`;
    const text = buildProductInquiryMessage(
      productTitle,
      productPageUrl,
      unavailable,
    );
    const waUrl = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      w="full"
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={3}
      bg={WHATSAPP_GREEN}
      color="white"
      _hover={{ bg: WHATSAPP_GREEN_HOVER }}
      _active={{ bg: WHATSAPP_GREEN_ACTIVE }}
      {...buttonProps}
      onClick={openInquiry}
    >
      <Box
        as="span"
        aria-hidden
        flexShrink={0}
        display="inline-flex"
        alignItems="center"
        fontSize={{ base: "22px", md: "24px" }}
      >
        <FaWhatsapp />
      </Box>
      <Box as="span" fontWeight="semibold">
        Posso te ajudar?
      </Box>
    </Button>
  );
}
