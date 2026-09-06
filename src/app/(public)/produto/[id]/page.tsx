"use client";
import { Box, Button, Container, Flex, Grid } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { MemoryRouter as Router } from "react-router-dom";
import { getProductByIdAction } from "@/app/actions/products";
import { ProductImageGallery } from "@/app/components/public/product-image-gallery";
import { ProductInfo } from "@/app/components/public/product-info";
import { ProductPageHeader } from "@/app/components/public/product-page-header";
import { ErrorState, LoadingState } from "@/app/components/states";
import { NextRouterSync } from "@/app/hooks/use-next-router-sync";
import type { Product } from "@/core/schemas/product.schema";
import {
  getEffectiveColorVariants,
  getImagesForColor,
} from "@/shared/product-color-utils";
import {
  getAvailableSizes,
  getTotalStock,
  getTotalStockForColor,
  getVariantStockBySizeForColor,
} from "@/shared/product-stock-helpers";

function ProductDetailView({
  product,
  productIdParam,
  logoSrc,
  nextPathname,
}: {
  product: Product;
  productIdParam: string;
  logoSrc: string;
  nextPathname: string;
}) {
  const router = useRouter();

  const productImagesFallback =
    product.images?.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const colorVariants = useMemo(
    () => getEffectiveColorVariants(product),
    [product],
  );

  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    const first = colorVariants[0]?.color ?? "";
    setSelectedColor(first);
  }, [colorVariants]);

  const productImages = useMemo(() => {
    if (!selectedColor) return productImagesFallback;
    const imgs = getImagesForColor(product, selectedColor);
    return imgs.length > 0 ? imgs : productImagesFallback;
  }, [product, selectedColor, productImagesFallback]);

  const productData = useMemo(() => {
    const fallbackColor = colorVariants[0]?.color ?? "";
    const colorForStock = selectedColor || fallbackColor;

    return {
      id: product.id || productIdParam,
      title: product.title,
      price: product.price,
      description: product.description,
      sizes: product.sizes || [],
      availableSizes: getAvailableSizes(product, colorForStock || undefined),
      images: productImages,
      stock: colorForStock
        ? getTotalStockForColor(product, colorForStock)
        : getTotalStock(product),
      stockBySize:
        getVariantStockBySizeForColor(product, colorForStock) ??
        product.stockBySize,
    };
  }, [product, productIdParam, productImages, selectedColor, colorVariants]);

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
                  alt={productData.title || "Produto"}
                />
              </Box>

              <Box w="full">
                <ProductInfo
                  productId={productData.id}
                  title={productData.title || "Produto"}
                  price={productData.price || 0}
                  description={productData.description || ""}
                  sizes={productData.sizes}
                  availableSizes={productData.availableSizes}
                  maxQuantity={10}
                  stock={productData.stock}
                  stockBySize={productData.stockBySize}
                  isActive={product.isActive !== false}
                  colorVariants={colorVariants}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                />
              </Box>
            </Grid>
          </Container>
        </Flex>
      </Flex>
    </Router>
  );
}

export default function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();

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
      } catch {
        setError("Não foi possível carregar o produto. Tente novamente.");
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

  return (
    <ProductDetailView
      product={product}
      productIdParam={id}
      logoSrc={logoSrc}
      nextPathname={nextPathname}
    />
  );
}
