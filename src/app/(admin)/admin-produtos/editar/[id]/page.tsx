"use client";

import { Box, Button, Container, Text } from "@chakra-ui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { ProductEditForm } from "@/app/components/admin/product-edit-form";
import { LoadingState } from "@/app/components/states/loading-state";
import { useProductCRUD } from "@/app/hooks/use-product-crud";

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const { selectedProduct, isLoading, error, loadProduct } = useProductCRUD();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !id) return;
    loadProduct(id);
  }, [mounted, id, loadProduct]);

  if (!mounted) {
    return null;
  }

  if (!id) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Produto não encontrado.</Text>
        <Button mt={4} onClick={() => router.push("/admin-produtos")}>
          Voltar
        </Button>
      </Container>
    );
  }

  if (isLoading && !selectedProduct) {
    return (
      <Box py={8}>
        <LoadingState />
      </Box>
    );
  }

  if (error || !selectedProduct || selectedProduct.id !== id) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text color="red.600">
          {error || "Não foi possível carregar o produto."}
        </Text>
        <Button mt={4} onClick={() => router.push("/admin-produtos")}>
          <IoArrowBack style={{ marginRight: 8 }} />
          Voltar à lista
        </Button>
      </Container>
    );
  }

  return <ProductEditForm product={selectedProduct} />;
}
