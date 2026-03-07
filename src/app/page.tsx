"use client";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { ProductGrid } from "./components/public/product-grid";
import { ProductPageHeader } from "./components/public/product-page-header";
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
          <ProductPageHeader logoSrc={logoSrc} />

          <ProductGrid products={products} />
        </main>
      </div>
    </Router>
  );
}
