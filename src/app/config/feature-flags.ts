/**
 * Feature flags do painel admin (e-commerce).
 * Flags sensíveis no servidor: use FEATURE_* (não expor lógica crítica só com NEXT_PUBLIC).
 */

const truthy = (v: string | undefined) => v === "true" || v === "1";

/** Ajuste rápido de estoque (ex.: baixar quantidade) — UI + autorização na Server Action */
export function isAdminStockToolsEnabled(): boolean {
  return truthy(process.env.FEATURE_ADMIN_STOCK_TOOLS);
}

/** Atalho para inativar produto (continua na vitrine como esgotado/indisponível) */
export function isAdminSoftDeactivateEnabled(): boolean {
  return truthy(process.env.FEATURE_ADMIN_SOFT_DEACTIVATE);
}

/** Bipagem rápida de produtos (cria DRAFT ou incrementa stock) */
export function isAdminStockScanEnabled(): boolean {
  return truthy(process.env.FEATURE_ADMIN_STOCK_SCAN);
}

/** Espelho para o cliente (mostrar botões). Deve acompanhar FEATURE_* no deploy. */
export const adminFeatureFlagsClient = {
  stockTools: truthy(process.env.NEXT_PUBLIC_FEATURE_ADMIN_STOCK_TOOLS),
  softDeactivate: truthy(process.env.NEXT_PUBLIC_FEATURE_ADMIN_SOFT_DEACTIVATE),
} as const;
