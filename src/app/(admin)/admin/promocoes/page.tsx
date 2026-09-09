/**
 * Página: Admin — Promoções
 *
 * Guard de servidor pela feature flag (bloqueia acesso direto por URL quando
 * desligada) — a UI em si é toda client, ver `PromotionsPageClient`.
 */

import { notFound } from "next/navigation";
import { isAdminPromotionsEnabled } from "@/app/config/feature-flags";
import { PromotionsPageClient } from "./promotions-page-client";

export default function AdminPromotionsPage() {
  if (!isAdminPromotionsEnabled()) {
    notFound();
  }

  return <PromotionsPageClient />;
}
