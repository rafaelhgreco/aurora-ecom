"use client";

import {
  Box,
  Button,
  Card,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { IoBarcode } from "react-icons/io5";
import { scanBarcodeAction } from "@/app/actions/stock-scan";
import { toaster } from "@/components/ui/toaster";

export function BarcodeScanner() {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    barcode: string;
    created: boolean;
    stock: number;
  } | null>(null);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    setBarcode(onlyDigits);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[BarcodeScanner] handleScan iniciado", { barcode });

    if (!barcode.trim()) {
      console.log("[BarcodeScanner] código vazio, abortando");
      toaster.create({
        title: "Código vazio",
        description: "Digite um código de barras",
        type: "warning",
      });
      return;
    }

    setIsScanning(true);
    try {
      console.log(
        "[BarcodeScanner] chamando scanBarcodeAction com",
        barcode.trim(),
      );
      const result = await scanBarcodeAction(barcode.trim());
      console.log("[BarcodeScanner] resultado recebido:", result);

      if (result.success) {
        const { product, created } = result.data;
        console.log("[BarcodeScanner] sucesso", { product, created });
        setLastResult({
          barcode: product.barcode || barcode,
          created,
          stock: product.stock,
        });

        toaster.create({
          title: created ? "Produto criado" : "Estoque atualizado",
          description: created
            ? `Novo produto DRAFT com stock=1 (barcode: ${barcode})`
            : `Stock atualizado para ${product.stock}`,
          type: "success",
          duration: 3000,
        });

        setBarcode("");
      } else {
        console.error(
          "[BarcodeScanner] erro retornado pela action:",
          result.error,
          result.details,
        );
        toaster.create({
          title: "Erro ao escanear",
          description: result.error,
          type: "error",
        });
      }
    } catch (error) {
      console.error("[BarcodeScanner] exceção capturada:", error);
      toaster.create({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        type: "error",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={2}>
          <IoBarcode size={24} />
          <Text fontWeight="bold">Testador de Bipagem</Text>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack gap={4} align="stretch">
          <Text fontSize="sm" color="gray.600">
            Digite um código de barras para testar a bipagem. Se for novo, cria
            um produto DRAFT com stock=1. Se já existe, incrementa o stock.
          </Text>

          <form onSubmit={handleScan}>
            <HStack gap={2} mb={4}>
              <Input
                placeholder="Digite o código de barras..."
                value={barcode}
                onChange={handleBarcodeChange}
                disabled={isScanning}
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <Button
                type="submit"
                colorScheme="blue"
                disabled={isScanning || !barcode.trim()}
                loading={isScanning}
              >
                {isScanning ? <Spinner size="sm" /> : "Bipar"}
              </Button>
            </HStack>
          </form>

          {lastResult && (
            <Box
              p={3}
              bg="green.50"
              borderRadius="md"
              borderLeft="4px solid"
              borderColor="green.500"
            >
              <VStack align="start" gap={1}>
                <Text fontWeight="bold" fontSize="sm">
                  ✅ Último resultado:
                </Text>
                <Text fontSize="sm">
                  <strong>Código:</strong> {lastResult.barcode}
                </Text>
                <Text fontSize="sm">
                  <strong>Stock:</strong> {lastResult.stock}
                </Text>
                <Text fontSize="sm" color="green.700">
                  {lastResult.created
                    ? "🆕 Produto novo criado em DRAFT"
                    : "📈 Stock incrementado"}
                </Text>
              </VStack>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
