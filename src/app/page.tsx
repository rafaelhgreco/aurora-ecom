"use client";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { Header } from "storybook-react";
import { ProductGrid } from "./components/product-grid";
import { EmptyState, ErrorState, LoadingState } from "./components/states";
import { NextRouterSync } from "./hooks/use-next-router-sync";
import { useProducts } from "./hooks/use-products";
import styles from "./page.module.css";

export default function Home() {
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();

  const { products, loading, error } = useProducts();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar produtos"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto encontrado"
        description="Não há produtos disponíveis no momento. Volte mais tarde para conferir nossas novidades!"
      />
    );
  }

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

          <ProductGrid products={products} />
        </main>
      </div>
    </Router>
  );
}
