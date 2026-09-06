"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Suspense, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { BarcodeScanner } from "@/app/components/admin/barcode-scanner";
import { DraftProductTable } from "@/app/components/admin/draft-product-table";
import { EmptyState } from "@/app/components/states/empty-state";
import { LoadingState } from "@/app/components/states/loading-state";
import { useDraftProducts } from "@/app/hooks/use-draft-products";

export default function RevisaoProdutosPage() {
  return (
    <Suspense fallback={<LoadingState minHeight="400px" />}>
      <RevisaoContent />
    </Suspense>
  );
}

function RevisaoContent() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { products, loading, error, totalPages } = useDraftProducts({
    page,
    limitCount: limit,
  });

  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" gap={6}>
          <VStack align="start" gap={1}>
            <Heading size="lg">Revisão de Produtos</Heading>
            <Text color="gray.600">Enriqueça produtos bipados</Text>
          </VStack>
          <Box
            p={4}
            borderWidth={1}
            borderColor="red.200"
            bg="red.50"
            rounded="md"
          >
            <Text color="red.700">{error}</Text>
          </Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack align="stretch" gap={6}>
        <VStack align="start" gap={1}>
          <Heading size="lg">Revisão de Produtos</Heading>
          <Text color="gray.600">
            {loading
              ? "Carregando..."
              : `${products.length} produto(s) em rascunho`}
          </Text>
        </VStack>

        <BarcodeScanner />

        {loading ? (
          <LoadingState minHeight="300px" />
        ) : products.length === 0 ? (
          <EmptyState
            title="Nenhum produto em rascunho"
            description="Comece bipando produtos para enriquecê-los"
          />
        ) : (
          <>
            <DraftProductTable products={products} />

            {totalPages > 1 && (
              <HStack justify="space-between" pt={4}>
                <Button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  size="sm"
                >
                  <IoChevronBack style={{ marginRight: 4 }} />
                  Anterior
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Página {page} de {totalPages}
                </Text>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  size="sm"
                >
                  Próxima
                  <IoChevronForward style={{ marginLeft: 4 }} />
                </Button>
              </HStack>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
}
