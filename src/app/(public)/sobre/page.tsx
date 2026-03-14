"use client";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { ProductPageHeader } from "../../components/public/product-page-header";
import { UnderConstruction } from "../../components/public/under-construction";
import { NextRouterSync } from "../../hooks/use-next-router-sync";
import styles from "../../page.module.css";

export default function Sobre() {
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();

  return (
    <Router initialEntries={[nextPathname]}>
      <NextRouterSync />
      <div className={styles.page}>
        <main className={styles.main}>
          <ProductPageHeader logoSrc={logoSrc} />
          <UnderConstruction />
        </main>
      </div>
    </Router>
  );
}
