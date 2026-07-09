/**
 * Hook personalizado para carregar produtos
 * Demonstra como integrar Server Actions em hooks reutilizáveis
 */

"use client";

import { useEffect, useState } from "react";
import { listProductsAction } from "@/app/actions/products";
import type { Product, ProductFilter } from "@/core/schemas/product.schema";
import { PUBLIC_GENERIC } from "@/shared/errors/client-error-messages";

function filterDependencyKey(filter?: ProductFilter): string {
  return filter === undefined ? "" : JSON.stringify(filter);
}

export function useProducts(filter?: ProductFilter) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = filterDependencyKey(filter);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const result = await listProductsAction(
          filterKey ? (JSON.parse(filterKey) as ProductFilter) : undefined,
        );

        if (isMounted) {
          if (result.success) {
            setProducts(result.data);
          } else {
            setError(result.error);
          }
        }
      } catch {
        if (isMounted) {
          setError(PUBLIC_GENERIC);
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
  }, [filterKey]);

  return { products, loading, error };
}
