"use client";
import { Box, Button, Container, Grid } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { use } from "react";
import { IoArrowBack } from "react-icons/io5";
import { MemoryRouter as Router } from "react-router-dom";
import { Header } from "storybook-react";
import { ProductImageGallery } from "@/app/components/product-image-gallery";
import { ProductInfo } from "@/app/components/product-info";
import { NextRouterSync } from "@/app/hooks/use-next-router-sync";
import styles from "@/app/page.module.css";

// Mock data - futuramente virá de uma API
const mockProduct = {
  title: 'SLIPPER "VIGA X CLASS" BLACK',
  price: 1300.0,
  description: `SAPATO MOCASSIM "VIGA X CLASS" COURO PRETO
100% COURO LEGÍTIMO MACIO / 100% SOFT GENUINE LEATHER
AJUSTE EM ELÁSTICO NA PARTE SUPERIOR COM REGULADOR METAL CLASS PRETO / ELASTIC ADJUSTMENT AT THE TOP WITH BLACK METAL CORD LOCK BY CLASS
PAR DE REGULADOR METAL CLASS AÇO ESCOVADO EXTRA / EXTRA BRUSHED STEEL CORD LOCK BY CLASS
SOLADO DE BORRACHA / RUBBER SOLE
INTERIOR FORRADO EM COURO MACIO / INTERIOR LINED WITH SOFT LEATHER
PALMILHA ANATÔMICA / ANATOMIC INSOLE
FEITO NO BRASIL / MADE IN BRAZIL`,
  sizes: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
  availableSizes: ["34", "35", "36", "37", "38", "39", "40"],
  images: [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=800",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800",
  ],
};

export default function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();
  const router = useRouter();

  const handleBuy = (size: string, quantity: number) => {
    console.log("Comprar:", { id, size, quantity });
    // Implementar lógica de compra aqui
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
                  images={mockProduct.images}
                  alt={mockProduct.title}
                />
              </Box>

              <Box>
                <ProductInfo
                  title={mockProduct.title}
                  price={mockProduct.price}
                  description={mockProduct.description}
                  sizes={mockProduct.sizes}
                  availableSizes={mockProduct.availableSizes}
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
