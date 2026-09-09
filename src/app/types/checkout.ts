/**
 * Types para WhatsApp Checkout — reutiliza entidades do core para evitar duplicação.
 */

/**
 * Formato JSON de um item do carrinho para checkout.
 * Usado na comunicação com o servidor (WhatsApp checkout).
 */
export interface CartItemJSON {
  productId: string;
  quantity: number;
  variants?: {
    size?: string;
    color?: string;
  };
}

/**
 * Resultado do checkout no WhatsApp
 */
export interface WhatsAppCheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
  total?: number;
  /** ID do pedido criado no Firestore (para gestão no admin) */
  orderId?: string;
}

/**
 * Item enriquecido com dados do produto (servidor) — não confundir com o
 * `EnrichedCartItem` de `hooks/use-cart.ts`, que é o formato client-side
 * (baseado em `CartItemEntity`/`ProductEntity`, com estado de loading/erro).
 */
export interface EnrichedCheckoutItem {
  productId: string;
  quantity: number;
  variants?: {
    size?: string;
    color?: string;
  };
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
    isActive: boolean;
    stock: number;
  };
  subtotal: number;
}
