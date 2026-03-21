/**
 * Types para WhatsApp Checkout
 * Reutiliza entidades do core para evitar duplicação
 */

import type { CartItemEntity, ProductEntity } from "@/core/entities";

/**
 * Formato JSON de um item do carrinho para checkout
 * Usado na comunicação com o servidor (WhatsApp checkout)
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
 * @deprecated Use CartItemJSON
 */
export type CartItem = CartItemJSON;

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
 * Item enriquecido com dados do produto (servidor)
 */
export interface EnrichedCartItem {
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

/**
 * Helper para converter CartItemEntity em formato JSON
 */
export declare function cartItemEntityToJSON(
  entity: CartItemEntity,
): CartItemJSON;

/**
 * Helper para converter CartItemJSON em CartItemEntity
 */
export declare function cartItemJSONToEntity(
  plain: CartItemJSON,
): CartItemEntity;

/**
 * @deprecated Use cartItemJSONToEntity
 */
export declare function plainToCartItemEntity(
  plain: CartItemJSON,
): CartItemEntity;

/**
 * Helper para enriquecer CartItemEntity com dados do produto
 */
export declare function enrichCartItem(
  item: CartItemEntity,
  product: ProductEntity,
): EnrichedCartItem;
