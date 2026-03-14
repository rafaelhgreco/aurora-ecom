"use client";
import { Box, Button, Container, Flex, Grid } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { MemoryRouter as Router } from "react-router-dom";
import { getProductByIdAction } from "@/app/actions/products";
import { ProductImageGallery } from "@/app/components/public/product-image-gallery";
import { ProductInfo } from "@/app/components/public/product-info";
import { ProductPageHeader } from "@/app/components/public/product-page-header";
import { ErrorState, LoadingState } from "@/app/components/states";
import { NextRouterSync } from "@/app/hooks/use-next-router-sync";
import type { Product } from "@/core/schemas/product.schema";

export default function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const result = await getProductByIdAction(id);

        if (result.success) {
          setProduct(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar produto",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Produto não encontrado"
        message={error || "Não foi possível encontrar este produto."}
        backUrl="/"
        backText="Voltar para Home"
        onRetry={() => window.location.reload()}
      />
    );
  }

  const productData = {
    id: product.id || id, // Usa o ID do produto ou o da URL
    title: product.title,
    price: product.price,
    description: product.description,
    sizes: product.sizes || [],
    availableSizes: product.sizes || [],
    images: product.images || [product.imageUrl],
    stock: product.stock,
  };

  return (
    <Router initialEntries={[nextPathname]}>
      <NextRouterSync />
      <Flex minH="100vh" align="center" justify="center" bg="white">
        <Flex
          as="main"
          direction="column"
          w="full"
          maxW="1440px"
          minH="100vh"
          p={{ base: "4", md: "8", lg: "10" }}
          bg="white"
        >
          <ProductPageHeader logoSrc={logoSrc} />
          <Container maxW="1200px" mt="8" p={{ base: "0", md: "4" }}>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              size="sm"
              mb="6"
            >
              <IoArrowBack style={{ marginRight: "8px" }} /> Voltar
            </Button>

            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={{ base: "8", md: "12" }}
              w="full"
            >
              <Box w="full" overflow="hidden">
                <ProductImageGallery
                  images={productData.images}
                  alt={productData.title}
                />
              </Box>

              <Box w="full">
                <ProductInfo
                  productId={productData.id}
                  title={productData.title}
                  price={productData.price}
                  description={productData.description}
                  sizes={productData.sizes}
                  availableSizes={productData.availableSizes}
                  maxQuantity={10}
                  stock={productData.stock}
                />
              </Box>
            </Grid>
          </Container>
        </Flex>
      </Flex>
    </Router>
  );
}
