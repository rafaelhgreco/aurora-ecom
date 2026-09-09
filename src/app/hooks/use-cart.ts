"use client";

/**
 * Hook: useCart
 * Gerencia lógica de negócio do carrinho com produtos
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/app/utils/price-formatter";
import type { CartItemEntity, ProductSize } from "@/core/entities";
import { ProductEntity } from "@/core/entities";
import { sumCurrency } from "@/shared/money";
import { getProductByIdAction } from "../actions/products";
import { useCartContext } from "../contexts/cart-context";
import type { CartItemJSON } from "../types/checkout";

export interface EnrichedCartItem {
  item: CartItemEntity;
  product: ProductEntity | null;
  subtotal: number;
  loading: boolean;
  error?: string;
}

export function useCart() {
  const context = useCartContext();
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  // Use ref para evitar re-renders infinitos
  const productsMapRef = useRef<Map<string, ProductEntity>>(new Map());

  /**
   * Carrega produtos do Firestore para enriquecer itens do carrinho
   */
  const loadProducts = useCallback(async () => {
    const items = context.cart.getItems();
    if (items.length === 0) {
      setEnrichedItems([]);
      return;
    }

    setLoading(true);

    const enriched = await Promise.all(
      items.map(async (item): Promise<EnrichedCartItem> => {
        let product = productsMapRef.current.get(item.productId);

        // Se não tem o produto em cache, busca do Firestore
        if (!product) {
          try {
            const result = await getProductByIdAction(item.productId);
            if (result.success && result.data) {
              product = new ProductEntity(result.data);
              productsMapRef.current.set(item.productId, product);
            }
          } catch {
            // Falha reportada ao usuário via `error` do item enriquecido abaixo.
          }
        }

        return {
          item,
          product: product || null,
          subtotal: product ? item.calculateSubtotal(product) : 0,
          loading: false,
          error: !product ? "Produto não encontrado" : undefined,
        };
      }),
    );

    setEnrichedItems(enriched);
    setLoading(false);
  }, [context.cart]);

  // Recarrega produtos quando itens do carrinho mudarem
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /**
   * Calcula o total do carrinho
   */
  const calculateTotal = useCallback((): number => {
    return sumCurrency(enrichedItems.map((item) => item.subtotal));
  }, [enrichedItems]);

  /**
   * Valida todos os itens do carrinho
   */
  const validateCart = useCallback((): Array<{
    item: CartItemEntity;
    error: string;
  }> => {
    return context.cart.validate(productsMapRef.current);
  }, [context.cart]);

  /**
   * Verifica se tem estoque para todos os itens
   */
  const hasStock = useCallback((): boolean => {
    return context.cart.hasStock(productsMapRef.current);
  }, [context.cart]);

  /**
   * Remove itens inválidos (inativos ou sem estoque)
   */
  const removeInvalidItems = useCallback((): number => {
    const newCart = context.cart.clone();
    const removedCount = newCart.removeInvalidItems(productsMapRef.current);

    if (removedCount > 0) {
      context.replaceCart(newCart);
    }

    return removedCount;
  }, [context]);

  /**
   * Atualiza o tamanho de um item
   */
  const updateItemSize = useCallback(
    (itemKey: string, size: ProductSize) => {
      const item = context.cart.getItem(itemKey);
      context.updateItemVariants(itemKey, {
        size,
        ...(item?.variants?.color ? { color: item.variants.color } : {}),
      });
    },
    [context],
  );

  const updateItemColor = useCallback(
    (itemKey: string, color: string) => {
      const item = context.cart.getItem(itemKey);
      if (!item) return;
      context.updateItemVariants(itemKey, {
        color,
        ...(item.variants?.size ? { size: item.variants.size } : {}),
      });
    },
    [context],
  );

  /**
   * Converte itens do carrinho para formato WhatsApp
   */
  const toWhatsAppCartItems = useCallback((): CartItemJSON[] => {
    return enrichedItems.map((enriched) => {
      const cartItem: CartItemJSON = {
        productId: enriched.item.productId,
        quantity: enriched.item.quantity,
      };

      const v = enriched.item.variants;
      if (v?.size || v?.color) {
        cartItem.variants = {
          ...(v.size ? { size: v.size } : {}),
          ...(v.color ? { color: v.color } : {}),
        };
      }

      return cartItem;
    });
  }, [enrichedItems]);

  /**
   * Total formatado
   */
  const formattedTotal = useMemo(() => {
    return formatPrice(calculateTotal());
  }, [calculateTotal]);

  /**
   * Estoque disponível para o item (por tamanho quando aplicável)
   */
  const getStockForItem = useCallback((enriched: EnrichedCartItem): number => {
    const { item, product } = enriched;
    if (!product) return 0;
    const size = item.variants?.size;
    const color = item.variants?.color;
    if (size != null && product.sizes?.includes(size)) {
      return product.getStockForSize(size, color);
    }
    return color
      ? product.getTotalStockForColor(color)
      : product.getTotalStock();
  }, []);

  /**
   * Verifica se pode fazer checkout (similar à validação da página de produto)
   * Bloqueia checkout se algum item exceder o estoque disponível (por tamanho quando aplicável)
   */
  const canCheckout = useMemo(() => {
    if (enrichedItems.length === 0) return false;

    return enrichedItems.every((enriched) => {
      const { item, product } = enriched;
      if (!product) return false;

      const available = getStockForItem(enriched);
      return item.quantity > 0 && item.quantity <= available;
    });
  }, [enrichedItems, getStockForItem]);

  /**
   * Retorna mensagem explicando por que não pode fazer checkout
   */
  const checkoutBlockReason = useMemo(() => {
    if (enrichedItems.length === 0) return "Carrinho vazio";

    for (const enriched of enrichedItems) {
      const { item, product } = enriched;

      if (!product) return "Alguns produtos não foram carregados";
      if (item.quantity <= 0) return "Quantidade inválida no carrinho";

      const available = getStockForItem(enriched);
      if (item.quantity > available) {
        const sizeInfo = item.variants?.size
          ? ` para ${item.variants.size}`
          : "";
        const colorInfo = item.variants?.color
          ? ` · cor ${item.variants.color}`
          : "";
        return `${product.title} tem estoque insuficiente (disponível${sizeInfo}${colorInfo}: ${available})`;
      }
    }

    return "";
  }, [enrichedItems, getStockForItem]);

  return {
    // Estado
    cart: context.cart,
    enrichedItems,
    loading,
    isOpen: context.isOpen,

    // Computed
    itemCount: context.getItemCount(),
    totalQuantity: context.getTotalQuantity(),
    total: formattedTotal,
    canCheckout,
    checkoutBlockReason,

    // Actions
    addItem: context.addItem,
    removeItem: context.removeItem,
    updateItemQuantity: context.updateItemQuantity,
    updateItemSize,
    updateItemColor,
    clearCart: context.clearCart,
    openCart: context.openCart,
    closeCart: context.closeCart,

    // Validations
    validateCart,
    hasStock,
    removeInvalidItems,

    // Utils
    toWhatsAppCartItems,
    reload: loadProducts,
  };
}
