"use client";

import { useState } from "react";
import {
  adjustProductStockAction,
  setProductActiveFlagAction,
} from "@/app/actions/products";
import { adminFeatureFlagsClient } from "@/app/config/feature-flags";
import type { Product } from "@/app/types/product";
import { toaster } from "@/components/ui/toaster";

/**
 * Ações rápidas de estoque/vitrine compartilhadas entre ProductTable
 * (desktop) e ProductCard (mobile), evitando duplicar a lógica de
 * negócio nos dois lugares onde a lista de produtos é renderizada.
 */
export function useProductQuickActions(onInventoryChange?: () => void) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pauseConfirmProduct, setPauseConfirmProduct] =
    useState<Product | null>(null);
  const showStockTools = adminFeatureFlagsClient.stockTools;
  const showSoftDeactivate = adminFeatureFlagsClient.softDeactivate;
  const showQuickActions = showStockTools || showSoftDeactivate;

  const runQuick = async (productId: string, fn: () => Promise<unknown>) => {
    setBusyId(productId);
    try {
      await fn();
      onInventoryChange?.();
    } finally {
      setBusyId(null);
    }
  };

  const handleStockMinus = (product: Product) => {
    const pid = product.id;
    if (!pid) return;
    void runQuick(pid, async () => {
      const r = await adjustProductStockAction(pid, -1);
      if (r.success) {
        toaster.create({
          title: "Estoque atualizado",
          description: "Uma unidade foi baixada.",
          type: "success",
          duration: 3000,
        });
      } else {
        toaster.create({
          title: "Não foi possível ajustar",
          description: r.error,
          type: "error",
          duration: 5000,
        });
      }
    });
  };

  const handleToggleActive = (product: Product) => {
    const pid = product.id;
    if (!pid) return;
    if (product.isActive) {
      setPauseConfirmProduct(product);
      return;
    }
    void runQuick(pid, async () => {
      const r = await setProductActiveFlagAction(pid, true);
      if (r.success) {
        toaster.create({
          title: "Produto reativado",
          description: "Volta a aparecer como disponível (adicione estoque).",
          type: "success",
          duration: 4000,
        });
      } else {
        toaster.create({
          title: "Erro",
          description: r.error,
          type: "error",
          duration: 5000,
        });
      }
    });
  };

  const handleConfirmPause = async () => {
    const product = pauseConfirmProduct;
    const pid = product?.id;
    if (!pid) return;
    setPauseConfirmProduct(null);
    void runQuick(pid, async () => {
      const r = await setProductActiveFlagAction(pid, false);
      if (r.success) {
        toaster.create({
          title: "Produto pausado na vitrine",
          description: "Estoque zerado. Continua na loja como esgotado.",
          type: "success",
          duration: 4000,
        });
      } else {
        toaster.create({
          title: "Erro",
          description: r.error,
          type: "error",
          duration: 5000,
        });
      }
    });
  };

  return {
    busyId,
    pauseConfirmProduct,
    setPauseConfirmProduct,
    showStockTools,
    showSoftDeactivate,
    showQuickActions,
    handleStockMinus,
    handleToggleActive,
    handleConfirmPause,
  };
}
