import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Alinha SSR/hidratação do Emotion (Chakra) com o servidor; ver:
  // https://next.chakra-ui.com/docs/get-started/frameworks/next-app#hydration-errors
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
};

export default nextConfig;
