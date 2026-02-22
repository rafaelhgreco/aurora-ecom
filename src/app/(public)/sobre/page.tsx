"use client";
import { usePathname } from "next/navigation";
import { MemoryRouter as Router } from "react-router-dom";
import { NextRouterSync } from "../../hooks/use-next-router-sync";

export default function Sobre() {
  const nextPathname = usePathname();

  return (
    <Router initialEntries={[nextPathname]}>
      <NextRouterSync />
      <h1>Sobre a Aurora Ecom</h1>
    </Router>
  );
}
