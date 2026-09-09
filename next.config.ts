import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Alinha SSR/hidratação do Emotion (Chakra) com o servidor; ver:
  // https://next.chakra-ui.com/docs/get-started/frameworks/next-app#hydration-errors
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  async redirects() {
    return [
      { source: "/shop", destination: "/loja", permanent: true },
      { source: "/shop/:slug", destination: "/loja/:slug", permanent: true },
      { source: "/admin-produtos", destination: "/admin", permanent: true },
      {
        source: "/admin-produtos/novo",
        destination: "/admin/novo",
        permanent: true,
      },
      {
        source: "/admin-produtos/editar/:id",
        destination: "/admin/editar/:id",
        permanent: true,
      },
      {
        source: "/admin-produtos/importacao",
        destination: "/admin/importacao",
        permanent: true,
      },
      {
        source: "/admin-produtos/revisao",
        destination: "/admin/revisao",
        permanent: true,
      },
      {
        source: "/admin-categorias",
        destination: "/admin/categorias",
        permanent: true,
      },
      {
        source: "/admin-pedidos",
        destination: "/admin/pedidos",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
