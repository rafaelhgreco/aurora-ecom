"use client";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { Header } from "storybook-react";
import { ProductGrid } from "./components/product-grid";
import { NextRouterSync } from "./hooks/use-next-router-sync";
import styles from "./page.module.css";

const products = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    title: "Camiseta Básica Branca",
    subtitle: "Algodão Premium",
    price: 89.9,
  },
  {
    id: "2",
    imageUrl:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
    title: "Camiseta Preta Estampada",
    subtitle: "Coleção Verão",
    price: 119.9,
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop",
    title: "Camiseta Cinza Mescla",
    subtitle: "Algodão Premium",
    price: 89.9,
  },
  {
    id: "4",
    imageUrl:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop",
    title: "Camiseta Listrada",
    subtitle: "Edição Limitada",
    price: 149.9,
  },
];

export default function Home() {
  const logoSrc = "/logo.svg";
  const nextPathname = usePathname();

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
