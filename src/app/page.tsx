"use client";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { ProductPageHeader } from "./components/public/product-page-header";
import { HomeLanding } from "./components/public/shop";
import { NextRouterSync } from "./hooks/use-next-router-sync";
import styles from "./page.module.css";

/**
 * Home pública: vitrine editorial e atalhos para /shop e categorias.
 */
export default function Home() {
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();

  return (
    <Router initialEntries={[nextPathname]}>
      <NextRouterSync />
      <div className={styles.page}>
        <main className={styles.main}>
          <ProductPageHeader logoSrc={logoSrc} />
          <HomeLanding />
        </main>
      </div>
    </Router>
  );
}
