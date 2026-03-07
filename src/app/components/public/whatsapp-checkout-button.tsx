"use client";

import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { createWhatsAppCheckoutLink } from "@/app/actions/checkout";
import type { CartItemJSON } from "@/app/types/checkout";

interface WhatsAppCheckoutButtonProps {
  cart: CartItemJSON[];
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  buttonText?: string;
  disabled?: boolean;
  onSuccess?: (total: number) => void;
  onError?: (error: string) => void;
}

export function WhatsAppCheckoutButton({
  cart,
  variant = "solid",
  size = "lg",
  buttonText = "Finalizar pelo WhatsApp",
  disabled = false,
  onSuccess,
  onError,
}: WhatsAppCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  /**
   * Processa checkout e redireciona para WhatsApp
   */
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
        // Callback de sucesso
        if (result.total) {
          onSuccess?.(result.total);
        }

        // Redireciona para WhatsApp
        window.open(result.url, "_blank");
      } else {
        throw new Error(result.error || "Erro ao gerar link do WhatsApp");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao processar pedido";

      alert(`Erro: ${message}`);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      variant={variant}
      size={size}
      colorScheme="green"
      disabled={disabled || cart.length === 0}
      loading={loading}
      width="full"
    >
      <span role="img" aria-label="WhatsApp">
        💬
      </span>{" "}
      {buttonText}
    </Button>
  );
}
