"use client";

import { Box, Button, HStack, Input, VStack } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  checkBarcodeAction,
  scanBarcodeAction,
} from "@/app/actions/stock-scan";
import { toaster } from "@/components/ui/toaster";
import { IncrementStockDialog } from "./increment-stock-dialog";

export function BarcodeScanner() {
  const queryClient = useQueryClient();
  const [barcode, setBarcode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<{
    barcode: string;
    currentStock: number;
  } | null>(null);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value.replace(/\D/g, ""));
  };

  const refreshDraftList = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-draft-products"] });
  };

  const runScan = async (code: string, quantity?: number) => {
    console.log("[BarcodeScanner] runScan", { code, quantity });
    const result = await scanBarcodeAction(code, quantity);
    console.log("[BarcodeScanner] scanBarcodeAction resultado:", result);

    if (result.success) {
      const { product, created } = result.data;
      toaster.create({
        title: created ? "Produto criado" : "Estoque atualizado",
        description: created
          ? `Produto DRAFT criado (código: ${code})`
          : `Estoque atualizado para ${product.stock}`,
        type: "success",
        duration: 3000,
      });
      refreshDraftList();
    } else {
      console.error(
        "[BarcodeScanner] erro retornado pela action:",
        result.error,
      );
      toaster.create({
        title: "Erro ao escanear",
        description: result.error,
        type: "error",
      });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcode.trim();
    console.log("[BarcodeScanner] handleScan iniciado", { code });

    if (!code) {
      toaster.create({
        title: "Código vazio",
        description: "Digite um código de barras",
        type: "warning",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const check = await checkBarcodeAction(code);
      console.log("[BarcodeScanner] checkBarcodeAction resultado:", check);

      if (!check.success) {
        toaster.create({
          title: "Erro ao verificar código",
          description: check.error,
          type: "error",
        });
        return;
      }

      if (check.data.exists && check.data.product) {
        setDuplicateDialog({
          barcode: code,
          currentStock: check.data.product.stock,
        });
        return;
      }

      await runScan(code);
      setBarcode("");
    } catch (error) {
      console.error("[BarcodeScanner] exceção capturada:", error);
      toaster.create({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmIncrement = async (quantity: number) => {
    if (!duplicateDialog) return;
    setIsProcessing(true);
    try {
      await runScan(duplicateDialog.barcode, quantity);
      setBarcode("");
    } finally {
      setIsProcessing(false);
      setDuplicateDialog(null);
    }
  };

  return (
    <Box>
      <form onSubmit={handleScan}>
        <HStack gap={2}>
          <Input
            placeholder="Código de barras"
            value={barcode}
            onChange={handleBarcodeChange}
            disabled={isProcessing}
            autoFocus
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <Button
            type="submit"
            colorScheme="blue"
            disabled={isProcessing || !barcode.trim()}
            loading={isProcessing}
          >
            Bipar
          </Button>
        </HStack>
      </form>

      <IncrementStockDialog
        open={!!duplicateDialog}
        barcode={duplicateDialog?.barcode ?? ""}
        currentStock={duplicateDialog?.currentStock ?? 0}
        isLoading={isProcessing}
        onConfirm={handleConfirmIncrement}
        onCancel={() => setDuplicateDialog(null)}
      />
    </Box>
  );
}
