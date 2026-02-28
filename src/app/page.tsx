"use client";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { Header } from "storybook-react";
import { ProductGrid } from "./components/product-grid";
import { NextRouterSync } from "./hooks/use-next-router-sync";
import { useProducts } from "./hooks/use-products";
import styles from "./page.module.css";

export default function Home() {
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();

  // 🔥 Agora os produtos vêm do backend via Server Actions!
  const { products, loading, error } = useProducts();

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
              { label: "TEST BACKEND", path: "/test-backend" },
            ]}
          />

          {loading && (
            <Box display="flex" justifyContent="center" py={10}>
              <Spinner size="xl" />
            </Box>
          )}

          {error && (
            <Box textAlign="center" py={10}>
              <Text color="red.500">Erro ao carregar produtos: {error}</Text>
            </Box>
          )}

          {!loading && !error && <ProductGrid products={products} />}
        </main>
      </div>
    </Router>
  );
}
