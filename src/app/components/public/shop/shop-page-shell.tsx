/**
 * Layout comum das páginas públicas da loja (header + carrinho + Router sync).
 */

"use client";

import { Container } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { ProductPageHeader } from "@/app/components/public/product-page-header";
import { NextRouterSync } from "@/app/hooks/use-next-router-sync";
import pageStyles from "@/app/page.module.css";

interface ShopPageShellProps {
  children: React.ReactNode;
  /** Padding horizontal do container de conteúdo */
  containerMaxW?: string;
}

export function ShopPageShell({
  children,
  containerMaxW = "1200px",
}: ShopPageShellProps) {
  const nextPathname = usePathname();
  const logoSrc = "/logo.svg";

  return (
    <Router initialEntries={[nextPathname]}>
      <NextRouterSync />
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <ProductPageHeader logoSrc={logoSrc} />
          <Container
            maxW={containerMaxW}
            w="full"
            px={{ base: 4, md: 6 }}
            py={{ base: 6, md: 8 }}
          >
            {children}
          </Container>
        </main>
      </div>
    </Router>
  );
}
