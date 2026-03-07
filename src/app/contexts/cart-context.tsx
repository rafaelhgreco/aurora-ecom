"use client";

/**
 * Context API: Cart
 * Gerencia estado global do carrinho usando CartEntity
 */

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { CartItemVariants } from "@/core/entities";
import { CartEntity, CartItemEntity } from "@/core/entities";

interface CartContextValue {
  cart: CartEntity;
  addItem: (
    productId: string,
    quantity: number,
    variants?: CartItemVariants,
  ) => void;
  removeItem: (itemKey: string) => void;
  updateItemQuantity: (itemKey: string, quantity: number) => void;
  updateItemVariants: (itemKey: string, variants?: CartItemVariants) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalQuantity: () => number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "aurora-ecom-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartEntity>(() => {
    // Carrega carrinho do localStorage na inicialização
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          return CartEntity.fromJSON(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }
    return new CartEntity();
  });

  const [isOpen, setIsOpen] = useState(false);

  // Persiste carrinho no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.toJSON()));
      } catch (error) {
        console.error("Erro ao salvar carrinho:", error);
      }
    }
  }, [cart]);

  const addItem = (
    productId: string,
    quantity: number,
    variants?: CartItemVariants,
  ) => {
    const newItem = new CartItemEntity(productId, quantity, variants);
    const newCart = cart.clone();
    newCart.addItem(newItem);
    setCart(newCart);
  };

  const removeItem = (itemKey: string) => {
    const newCart = cart.clone();
    newCart.removeItem(itemKey);
    setCart(newCart);
  };

  const updateItemQuantity = (itemKey: string, quantity: number) => {
    const newCart = cart.clone();
    newCart.updateItemQuantity(itemKey, quantity);
    setCart(newCart);
  };

  const updateItemVariants = (itemKey: string, variants?: CartItemVariants) => {
    const newCart = cart.clone();
    newCart.updateItemVariants(itemKey, variants);
    setCart(newCart);
  };

  const clearCart = () => {
    setCart(new CartEntity());
  };

  const getItemCount = () => cart.getItemCount();
  const getTotalQuantity = () => cart.getTotalQuantity();

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateItemQuantity,
        updateItemVariants,
        clearCart,
        getItemCount,
        getTotalQuantity,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook para usar o carrinho
 * @throws Error se usado fora do CartProvider
 */
export function useCartContext() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartContext deve ser usado dentro de CartProvider");
  }

  return context;
}
