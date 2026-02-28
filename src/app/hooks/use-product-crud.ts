/**
 * Hook: useProductCRUD
 *
 * Gerencia todas as operações CRUD de produtos
 */

"use client";

import { useCallback, useState } from "react";
import {
  createProductAction,
  deleteProductAction,
  getProductByIdAction,
  listProductsAction,
  updateProductAction,
} from "@/app/actions/products";
import type {
  CreateProductData,
  Product,
  UpdateProductData,
} from "@/app/types/product";

export function useProductCRUD() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listProductsAction();
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        setError(!result.success ? result.error : "Erro ao carregar produtos");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getProductByIdAction(id);
      if (result.success && result.data) {
        setSelectedProduct(result.data);
      } else {
        setError(!result.success ? result.error : "Produto não encontrado");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(
    async (data: CreateProductData) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createProductAction(data);
        if (result.success && result.data) {
          await loadProducts();
          return { success: true, data: result.data };
        }
        const errorMsg = !result.success
          ? result.error
          : "Erro ao criar produto";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [loadProducts],
  );

  const updateProduct = useCallback(
    async (data: UpdateProductData) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await updateProductAction(data);
        if (result.success) {
          await loadProducts();
          return { success: true };
        }
        setError(result.error || "Erro ao atualizar produto");
        return { success: false, error: result.error };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [loadProducts],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await deleteProductAction(id);
        if (result.success) {
          await loadProducts();
          return { success: true };
        }
        setError(result.error || "Erro ao deletar produto");
        return { success: false, error: result.error };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [loadProducts],
  );

  return {
    products,
    selectedProduct,
    isLoading,
    error,
    loadProducts,
    loadProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    setSelectedProduct,
  };
}
