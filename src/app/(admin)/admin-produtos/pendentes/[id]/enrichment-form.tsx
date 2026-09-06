"use client";

import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishProductAction } from "@/app/actions/publish-product.action";
import { Field } from "@/components/ui/field";

export function EnrichmentForm({ barcode }: { barcode: string }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Preço inválido");
      return;
    }

    const result = await publishProductAction({
      barcode,
      title,
      price: priceNum,
    });

    if (result.success) {
      router.push("/admin-produtos/pendentes");
    } else {
      setError(result.error);
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      p={6}
      borderWidth={1}
      borderRadius="md"
      maxW="md"
    >
      <Stack gap={4}>
        <Field label="Nome">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Teclado Mecânico"
            required
            data-testid="input-title"
          />
        </Field>

        <Field label="Preço">
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 250.00"
            required
            data-testid="input-price"
          />
        </Field>

        {error && (
          <Text color="red.500" fontSize="sm" data-testid="error-message">
            {error}
          </Text>
        )}

        <Button type="submit" colorScheme="blue" data-testid="submit-btn">
          Publicar Produto
        </Button>
      </Stack>
    </Box>
  );
}
