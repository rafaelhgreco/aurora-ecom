/**
 * Página: Admin — Gerenciar produtos de uma promoção
 *
 * Guard de servidor pela feature flag (bloqueia acesso direto por URL quando
 * desligada) — a UI em si é toda client, ver `PromotionProductsPageClient`.
 */

import { notFound } from "next/navigation";
import { isAdminPromotionsEnabled } from "@/app/config/feature-flags";
import { PromotionProductsPageClient } from "./promotion-products-page-client";

export default function AdminPromotionProductsPage() {
  if (!isAdminPromotionsEnabled()) {
    notFound();
  }

  return <PromotionProductsPageClient />;
}
