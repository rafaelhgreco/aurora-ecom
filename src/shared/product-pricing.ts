/**
 * Cálculo do preço efetivo de um produto quando há promoção associada.
 * Função pura (sem I/O) — `Product` e `Promotion` são coleções Firestore
 * separadas, então quem chama já resolveu qual promoção (se houver) se
 * aplica a este produto. Ver `decorateProductsWithPricing` para o caso de
 * uso em lote (listagens), que faz essa resolução com uma única leitura.
 */

import { roundCurrency } from "./money";

export interface PromotableProduct {
  price: number;
  promotionId?: string | null;
  promotionOverridePrice?: number | null;
}

export interface PromotionForPricing {
  id?: string;
  discountPercentage: number;
  active: boolean;
}

export interface EffectivePricing {
  /** Preço a cobrar/exibir — igual a `product.price` quando não há desconto. */
  price: number;
  /** Valor a exibir riscado; `null` quando não há desconto aplicado. */
  originalPrice: number | null;
  hasDiscount: boolean;
}

/**
 * Resolve o preço efetivo de um produto dada sua promoção (ou `null`).
 *
 * O "valor riscado" é o valor base usado no cálculo (`promotionOverridePrice`
 * quando definido, senão `price`) — não sempre o preço de tabela, já que o
 * admin pode ter deliberadamente editado o valor base da promoção.
 */
export function computeEffectivePrice(
  product: PromotableProduct,
  promotion: PromotionForPricing | null,
  featureEnabled: boolean,
): EffectivePricing {
  const noDiscount: EffectivePricing = {
    price: roundCurrency(product.price),
    originalPrice: null,
    hasDiscount: false,
  };

  if (!featureEnabled) return noDiscount;
  if (!product.promotionId) return noDiscount;
  if (!promotion || !promotion.active) return noDiscount;
  if (promotion.id !== undefined && promotion.id !== product.promotionId) {
    return noDiscount;
  }
  if (promotion.discountPercentage <= 0) return noDiscount;

  const basePrice = product.promotionOverridePrice ?? product.price;
  const discounted = roundCurrency(
    basePrice * (1 - promotion.discountPercentage / 100),
  );

  return {
    price: discounted,
    originalPrice: roundCurrency(basePrice),
    hasDiscount: true,
  };
}

/** Repositório de promoções necessário para a decoração em lote. */
export interface PromotionLookup {
  findAll(): Promise<PromotionForPricing[]>;
}

/**
 * Decora uma lista de produtos serializados com `effectivePrice`/`originalPrice`.
 *
 * Faz no máximo **uma** leitura de `promotionRepository.findAll()` por chamada
 * — nunca um lookup por produto — mesmo padrão de escala já assumido pelo
 * `FirestoreProductRepository` (coleções pequenas o bastante para trazer
 * inteiras e filtrar em memória).
 */
export async function decorateProductsWithPricing<T extends PromotableProduct>(
  products: T[],
  promotionRepository: PromotionLookup,
  featureEnabled: boolean,
): Promise<(T & { effectivePrice: number; originalPrice: number | null })[]> {
  if (!featureEnabled) {
    return products.map((p) => ({
      ...p,
      effectivePrice: roundCurrency(p.price),
      originalPrice: null,
    }));
  }

  const hasAnyPromotion = products.some((p) => p.promotionId);
  const promotionsById = hasAnyPromotion
    ? new Map(
        (await promotionRepository.findAll()).map((promo) => [
          promo.id as string,
          promo,
        ]),
      )
    : new Map<string, PromotionForPricing>();

  return products.map((p) => {
    const promotion = p.promotionId
      ? (promotionsById.get(p.promotionId) ?? null)
      : null;
    const pricing = computeEffectivePrice(p, promotion, true);
    return {
      ...p,
      effectivePrice: pricing.price,
      originalPrice: pricing.originalPrice,
    };
  });
}
