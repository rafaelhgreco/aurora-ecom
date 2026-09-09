"use server";

/**
 * Server Action: WhatsApp Checkout
 *
 * Gera URL segura do WhatsApp com mensagem formatada do pedido.
 * Salva o pedido na coleção orders do Firestore e retorna o link.
 */

import type {
  CartItemJSON,
  EnrichedCheckoutItem,
  WhatsAppCheckoutResult,
} from "@/app/types/checkout";
import { formatPrice } from "@/app/utils/price-formatter";
import type { ProductEntity } from "@/core/entities";
import type { OrderItem } from "@/core/schemas/order.schema";
import { createOrder } from "@/infrastructure/repositories/firestore-order.repository";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import {
  aggregateQuantitiesByVariant,
  cartLineVariantKey,
  priceCartLine,
  sumCartLines,
  validateCartLinesShape,
} from "@/shared/cart-pricing";
import { handleActionError } from "@/shared/errors/action-error";

// Número do WhatsApp da loja (formato internacional sem sinais: 55DDDNUMERO)
const SHOP_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER || "5511999999999";

/**
 * Busca produtos no Firestore e enriquece os itens do carrinho — preço e
 * estoque nunca vêm do cliente, sempre recalculados a partir do produto.
 */
async function enrichCartItems(
  items: CartItemJSON[],
): Promise<EnrichedCheckoutItem[]> {
  const repository = new FirestoreProductRepository();
  const productCache = new Map<string, ProductEntity>();
  const requestedQuantityByVariant = aggregateQuantitiesByVariant(items);

  const enriched: EnrichedCheckoutItem[] = [];

  for (const item of items) {
    let product = productCache.get(item.productId);

    if (!product) {
      const found = await repository.findById(item.productId);
      if (!found) {
        throw new Error(`Produto ${item.productId} não encontrado`);
      }
      product = found;
      productCache.set(item.productId, product);
    }

    const totalRequestedForVariant =
      requestedQuantityByVariant.get(cartLineVariantKey(item)) ?? item.quantity;

    enriched.push(priceCartLine(item, product, totalRequestedForVariant));
  }

  return enriched;
}

/**
 * Monta a mensagem do pedido formatada
 */
function buildOrderMessage(
  items: EnrichedCheckoutItem[],
  total: number,
): string {
  const lines: string[] = [];

  lines.push("*NOVO PEDIDO*");
  lines.push("Olá! Gostaria de finalizar o seguinte pedido:");
  lines.push("");

  for (const item of items) {
    const name = item.product.title;
    const qty = item.quantity;
    const subtotal = formatPrice(item.subtotal);

    // Adiciona variações se existirem
    let variants = "";
    if (item.variants) {
      const parts: string[] = [];
      if (item.variants.size) parts.push(`Tamanho: ${item.variants.size}`);
      if (item.variants.color) parts.push(`Cor: ${item.variants.color}`);
      if (parts.length > 0) variants = ` (${parts.join(", ")})`;
    }

    lines.push(`- ${qty}x ${name}${variants} | Subtotal: ${subtotal}`);
  }

  lines.push("");
  lines.push("----------------------------------------");
  lines.push(`*Total do Pedido: ${formatPrice(total)}*`);
  lines.push("----------------------------------------");
  lines.push("");
  lines.push("Aguardo as instruções para pagamento e opções de entrega.");

  return lines.join("\n");
}

/**
 * Gera a URL do WhatsApp com a mensagem do pedido
 *
 * @param items - Array de itens do carrinho (apenas IDs, quantidades e variantes)
 * @returns Resultado com URL do WhatsApp ou erro
 */
export async function createWhatsAppCheckoutLink(
  items: CartItemJSON[],
): Promise<WhatsAppCheckoutResult> {
  try {
    // 1. Validação básica
    const validation = validateCartLinesShape(items);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // 2. Busca produtos no Firestore e calcula valores reais
    const enrichedItems = await enrichCartItems(items);

    // 3. Calcula total
    const total = sumCartLines(enrichedItems);

    // 4. Salva pedido no Firestore (para gestão no admin)
    const orderItems: OrderItem[] = enrichedItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      variants: item.variants,
      title: item.product.title,
      price: item.product.price,
      subtotal: item.subtotal,
    }));

    // Cria pedido (estoque só é decrementado quando o admin finaliza)
    const order = await createOrder(orderItems, total);

    // 5. Monta mensagem formatada
    const message = buildOrderMessage(enrichedItems, total);

    // 6. Codifica mensagem para URL
    const encodedMessage = encodeURIComponent(message);

    // 7. Gera URL do WhatsApp
    const whatsappUrl = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodedMessage}`;

    return {
      success: true,
      url: whatsappUrl,
      total,
      orderId: order.id,
    };
  } catch (error) {
    const { message } = handleActionError(
      "createWhatsAppCheckoutLink",
      error,
      "checkout",
    );
    return { success: false, error: message };
  }
}
