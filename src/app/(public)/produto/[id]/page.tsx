"use client";
import { Box, Button, Container, Grid } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { MemoryRouter as Router } from "react-router-dom";
import { Header } from "storybook-react";
import { getProductByIdAction } from "@/app/actions/products";
import { ProductImageGallery } from "@/app/components/product-image-gallery";
import { ProductInfo } from "@/app/components/product-info";
import { ErrorState, LoadingState } from "@/app/components/states";
import { NextRouterSync } from "@/app/hooks/use-next-router-sync";
import styles from "@/app/page.module.css";
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

  const handleBuy = (size: string, quantity: number) => {
    console.log("Comprar:", { id, size, quantity });
  };

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
    title: product.title,
    price: product.price,
    description: product.description,
    sizes: product.sizes || [],
    availableSizes: product.sizes || [],
    images: product.images || [product.imageUrl],
  };

  return (
    <Router initialEntries={[nextPathname]}>
      <NextRouterSync />
      <div className={styles.page}>
        <main className={styles.main}>
          <Header
            logo={logoSrc}
            items={[
              { label: "SHOP", path: "/" },
              { label: "ARQUIVO", path: "/dashboard" },
              { label: "SOBRE", path: "/sobre" },
            ]}
          />
          <Container maxW="1200px" mt="8">
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
              <Box>
                <ProductImageGallery
                  images={productData.images}
                  alt={productData.title}
                />
              </Box>

              <Box>
                <ProductInfo
                  title={productData.title}
                  price={productData.price}
                  description={productData.description}
                  sizes={productData.sizes}
                  availableSizes={productData.availableSizes}
                  maxQuantity={10}
                  onBuy={handleBuy}
                />
              </Box>
            </Grid>
          </Container>
        </main>
      </div>
    </Router>
  );
}
