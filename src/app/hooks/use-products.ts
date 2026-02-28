/**
 * Hook personalizado para carregar produtos
 * Demonstra como integrar Server Actions em hooks reutilizáveis
 */

"use client";

import { useEffect, useState } from "react";
import { listProductsAction } from "@/app/actions/products";
import type { Product, ProductFilter } from "@/core/schemas/product.schema";

export function useProducts(filter?: ProductFilter) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const result = await listProductsAction(filter);

        if (isMounted) {
          if (result.success) {
            setProducts(result.data);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar produtos",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [filter]);

  return { products, loading, error };
}
