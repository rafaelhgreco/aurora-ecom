/**
 * Helper functions para WhatsApp Checkout
 * Implementações dos helpers declarados em checkout.d.ts
 */

import type { CartItemVariants, ProductEntity } from "@/core/entities";
import { CartItemEntity } from "@/core/entities";
import type {
  CartItem,
  CartItemJSON,
  EnrichedCartItem,
  WhatsAppCheckoutResult,
} from "./checkout.d";

export type {
  CartItemJSON,
  EnrichedCartItem,
  WhatsAppCheckoutResult,
  CartItem,
};

/**
 * Helper para converter CartItemEntity em formato JSON
 */
export function cartItemEntityToJSON(entity: CartItemEntity): CartItemJSON {
  return entity.toJSON();
}

/**
 * Helper para converter CartItemJSON em CartItemEntity
 */
export function cartItemJSONToEntity(plain: CartItemJSON): CartItemEntity {
  return CartItemEntity.fromJSON(
    plain as {
      productId: string;
      quantity: number;
      variants?: CartItemVariants;
    },
  );
}

/**
 * @deprecated Use cartItemJSONToEntity
 */
export function plainToCartItemEntity(plain: CartItemJSON): CartItemEntity {
  return CartItemEntity.fromJSON(
    plain as {
      productId: string;
      quantity: number;
      variants?: CartItemVariants;
    },
  );
}

/**
 * Helper para enriquecer CartItemEntity com dados do produto
 */
export function enrichCartItem(
  item: CartItemEntity,
  product: ProductEntity,
): EnrichedCartItem {
  return {
    ...item.toJSON(),
    product: {
      id: product.id || "",
      title: product.title || "Produto",
      price: product.price || 0,
      imageUrl: product.imageUrl || "",
      isActive: product.isActive,
      stock: product.stock,
    },
    subtotal: item.calculateSubtotal(product),
  };
}
