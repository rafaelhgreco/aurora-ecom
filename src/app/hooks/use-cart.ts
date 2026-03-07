"use client";

/**
 * Hook: useCart
 * Gerencia lógica de negócio do carrinho com produtos
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CartItemEntity, ProductSize } from "@/core/entities";
import { ProductEntity } from "@/core/entities";
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

    const enriched: EnrichedCartItem[] = [];

    for (const item of items) {
      let product = productsMapRef.current.get(item.productId);

      // Se não tem o produto em cache, busca do Firestore
      if (!product) {
        try {
          const result = await getProductByIdAction(item.productId);
          if (result.success && result.data) {
            product = new ProductEntity(result.data);
            productsMapRef.current.set(item.productId, product);
          }
        } catch (error) {
          console.error(`Erro ao carregar produto ${item.productId}:`, error);
        }
      }

      enriched.push({
        item,
        product: product || null,
        subtotal: product ? item.calculateSubtotal(product) : 0,
        loading: false,
        error: !product ? "Produto não encontrado" : undefined,
      });
    }

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
    return enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
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
      // Atualiza o carrinho no contexto
      // Como não temos acesso direto ao setCart, vamos limpar e readicionar
      context.clearCart();
      for (const item of newCart.getItems()) {
        context.addItem(item.productId, item.quantity, item.variants);
      }
    }

    return removedCount;
  }, [context]);

  /**
   * Atualiza o tamanho de um item
   */
  const updateItemSize = useCallback(
    (itemKey: string, size: ProductSize) => {
      // Usa o novo método que mantém a quantidade
      context.updateItemVariants(itemKey, { size });
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

      if (enriched.item.variants?.size) {
        cartItem.variants = {
          size: enriched.item.variants.size,
        };
      }

      return cartItem;
    });
  }, [enrichedItems]);

  /**
   * Total formatado
   */
  const formattedTotal = useMemo(() => {
    const total = calculateTotal();
    return `R$ ${total.toFixed(2)}`;
  }, [calculateTotal]);

  /**
   * Verifica se pode fazer checkout (similar à validação da página de produto)
   * Bloqueia checkout se algum item exceder o estoque disponível
   */
  const canCheckout = useMemo(() => {
    // Não pode fazer checkout se carrinho vazio
    if (enrichedItems.length === 0) {
      return false;
    }

    // Verifica se todos os itens têm estoque suficiente
    return enrichedItems.every((enriched) => {
      const { item, product } = enriched;

      // Se produto não carregou, bloqueia
      if (!product) {
        return false;
      }

      // Quantidade deve ser válida e não exceder estoque
      return item.quantity > 0 && item.quantity <= product.stock;
    });
  }, [enrichedItems]);

  /**
   * Retorna mensagem explicando por que não pode fazer checkout
   */
  const checkoutBlockReason = useMemo(() => {
    if (enrichedItems.length === 0) {
      return "Carrinho vazio";
    }

    for (const enriched of enrichedItems) {
      const { item, product } = enriched;

      if (!product) {
        return "Alguns produtos não foram carregados";
      }

      if (item.quantity > product.stock) {
        return `${product.title} tem estoque insuficiente (disponível: ${product.stock})`;
      }

      if (item.quantity <= 0) {
        return "Quantidade inválida no carrinho";
      }
    }

    return "";
  }, [enrichedItems]);

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
