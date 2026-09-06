"use client";

import { Box, Button, Container, Heading, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { scanBarcodeAction } from "@/app/actions/scan-barcode.action";

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSimulateScan = async () => {
    if (!barcode) return;
    const result = await scanBarcodeAction(barcode);
    if (result.success) {
      setMessage(`Escaneado com sucesso: ${barcode}`);
      setBarcode("");
    } else {
      setMessage(`Erro: ${result.error}`);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Heading size="lg" mb={6}>
        Escanear Produto (Simulação)
      </Heading>

      <Box p={6} borderWidth={1} borderRadius="md" bg="white">
        <Text mb={4}>
          Nesta tela, futuramente a câmera será ativada para ler o código de
          barras.
        </Text>

        <Box mb={4}>
          <input
            type="text"
            placeholder="Digite o código (simulação)..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </Box>

        <Button colorScheme="blue" onClick={handleSimulateScan} mr={2}>
          Simular Bip
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/admin-produtos")}
        >
          Voltar
        </Button>

        {message && (
          <Text mt={4} color="green.600" fontWeight="bold">
            {message}
          </Text>
        )}
      </Box>
    </Container>
  );
}
