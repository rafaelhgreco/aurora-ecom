"use server";

import { Timestamp } from "firebase-admin/firestore";
import { requireAdminSession } from "@/app/services/require-admin-session";
import type {
  Order,
  OrderItemWithStock,
  OrderStatus,
  OrderWithStock,
} from "@/core/schemas/order.schema";
import type { ProductSize } from "@/core/schemas/product.schema";
import { generateOrdersAuditXlsxBuffer } from "@/infrastructure/export/generate-orders-audit-xlsx";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import {
  deleteAllOrders,
  getOrderById,
  listAllOrders,
  listOrders,
  updateOrderStatus as repoUpdateStatus,
} from "@/infrastructure/repositories/firestore-order.repository";
import type { ActionResult } from "@/shared/action-result";
import { handleActionError } from "@/shared/errors/action-error";
import { InternalError } from "@/shared/errors/internal-error";
import {
  getStockForSize,
  getTotalStock,
  getTotalStockForColor,
  hasVariantLevelStock,
} from "@/shared/product-stock-helpers";

export async function listOrdersAction(options?: {
  limitCount?: number;
  page?: number;
  status?: OrderStatus;
}): Promise<ActionResult<{ data: Order[]; totalCount: number }>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const result = await listOrders(options);
    return { success: true, data: result };
  } catch (error) {
    const { message } = handleActionError("listOrdersAction", error, "admin");
    return { success: false, error: message };
  }
}

/**
 * Lista pedidos enriquecidos com estoque atual de cada item.
 * Permite ao admin ver se há estoque suficiente antes de finalizar.
 */
export async function listOrdersWithStockAction(options?: {
  limitCount?: number;
  page?: number;
  status?: OrderStatus;
}): Promise<ActionResult<{ data: OrderWithStock[]; totalCount: number }>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const { data: orders, totalCount } = await listOrders(options);
    const enriched: OrderWithStock[] = [];

    const db = getAdminDb();
    if (!db) {
      return {
        success: true,
        data: {
          data: orders.map((o) => ({
            ...o,
            items: o.items.map((i) => ({
              ...i,
              currentStock: 0,
              sufficient: false,
            })),
          })),
          totalCount,
        },
      };
    }

    const productsRef = db.collection("products");

    for (const order of orders) {
      const itemsWithStock: OrderItemWithStock[] = [];

      for (const item of order.items) {
        const doc = await productsRef.doc(item.productId).get();
        let currentStock = 0;

        if (doc.exists) {
          const data = doc.data();
          if (!data) {
            itemsWithStock.push({
              ...item,
              currentStock: 0,
              sufficient: false,
            });
            continue;
          }
          const size = item.variants?.size as ProductSize | undefined;
          const color = item.variants?.color;
          const productLike = {
            stock: data.stock as number | undefined,
            sizes: data.sizes as ProductSize[] | undefined,
            stockBySize: data.stockBySize as
              | Partial<Record<ProductSize, number>>
              | undefined,
            colorVariants: data.colorVariants as
              | Array<{ color: string; stockBySize?: Record<string, number> }>
              | undefined,
          };
          if (size) {
            currentStock = getStockForSize(productLike, size, color);
          } else {
            currentStock = color
              ? getTotalStockForColor(productLike, color)
              : getTotalStock(productLike);
          }
        }

        itemsWithStock.push({
          ...item,
          currentStock,
          sufficient: currentStock >= item.quantity,
        });
      }

      enriched.push({
        ...order,
        items: itemsWithStock,
      });
    }

    return { success: true, data: { data: enriched, totalCount } };
  } catch (error) {
    const { message } = handleActionError(
      "listOrdersWithStockAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

export async function getOrderByIdAction(
  id: string,
): Promise<ActionResult<Order | null>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const order = await getOrderById(id);
    return { success: true, data: order };
  } catch (error) {
    const { message } = handleActionError("getOrderByIdAction", error, "admin");
    return { success: false, error: message };
  }
}

/**
 * Atualiza o status do pedido.
 * - FINALIZADA: decrementa estoque (venda concretizada).
 * - PENDENTE (Reabrir): devolve estoque (incrementa) — desfaz finalização.
 * - DECLINADA: devolve estoque apenas se vinha de FINALIZADA (erro humano).
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
): Promise<ActionResult<Order>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return { success: false, error: "Pedido não encontrado" };
    }

    const previousStatus = order.status;
    const updated = await repoUpdateStatus(orderId, newStatus);
    if (!updated) {
      return { success: false, error: "Erro ao atualizar status" };
    }

    if (newStatus === "FINALIZADA" && previousStatus === "PENDENTE") {
      await decrementStockForOrder(order);
    } else if (newStatus === "PENDENTE" && previousStatus === "FINALIZADA") {
      await incrementStockForOrder(order);
    } else if (newStatus === "DECLINADA" && previousStatus === "FINALIZADA") {
      await incrementStockForOrder(order);
    }

    return { success: true, data: updated };
  } catch (error) {
    const { message } = handleActionError(
      "updateOrderStatusAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

/**
 * Decrementa estoque dos produtos do pedido (ao finalizar).
 */
async function decrementStockForOrder(order: Order): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new InternalError("firebase_admin_not_initialized");

  const productsRef = db.collection("products");

  for (const item of order.items) {
    const docRef = productsRef.doc(item.productId);
    const snap = await docRef.get();
    if (!snap.exists) continue;

    const data = snap.data();
    if (!data) continue;

    const sizes = data.sizes as ProductSize[] | undefined;
    const stockBySize = data.stockBySize as Record<string, number> | undefined;
    const colorVariants = data.colorVariants as
      | Array<{ color: string; stockBySize?: Record<string, number> }>
      | undefined;
    const size = item.variants?.size as ProductSize | undefined;
    const color = item.variants?.color;

    const productLike = {
      stock: data.stock as number | undefined,
      sizes,
      stockBySize,
      colorVariants,
    };

    if (
      hasVariantLevelStock(productLike) &&
      color &&
      size &&
      sizes?.includes(size)
    ) {
      const idx = colorVariants?.findIndex((v) => v.color === color) ?? -1;
      if (idx < 0) {
        throw new Error(
          `Cor "${color}" não encontrada no produto "${item.title}".`,
        );
      }
      const cur = colorVariants?.[idx]?.stockBySize?.[size] ?? 0;
      if (cur < item.quantity) {
        throw new Error(
          `Estoque insuficiente para "${item.title}". Disponível: ${cur}, pedido: ${item.quantity}`,
        );
      }
      const rootStock = (data.stock as number) ?? 0;
      const updates: Record<string, unknown> = {
        [`colorVariants.${idx}.stockBySize.${size}`]: cur - item.quantity,
        stock: Math.max(0, rootStock - item.quantity),
        updatedAt: Timestamp.now(),
      };
      if (stockBySize && sizes?.includes(size)) {
        const aggCur = stockBySize[size] ?? 0;
        updates[`stockBySize.${size}`] = Math.max(0, aggCur - item.quantity);
      }
      await docRef.update(updates);
    } else if (size && sizes?.includes(size) && stockBySize) {
      const current = stockBySize[size] ?? 0;
      if (current < item.quantity) {
        throw new Error(
          `Estoque insuficiente para "${item.title}". Disponível: ${current}, pedido: ${item.quantity}`,
        );
      }
      await docRef.update({
        [`stockBySize.${size}`]: current - item.quantity,
        updatedAt: Timestamp.now(),
      });
    } else {
      const current = (data.stock as number) ?? 0;
      if (current < item.quantity) {
        throw new Error(
          `Estoque insuficiente para "${item.title}". Disponível: ${current}, pedido: ${item.quantity}`,
        );
      }
      await docRef.update({
        stock: current - item.quantity,
        updatedAt: Timestamp.now(),
      });
    }
  }
}

/**
 * Devolve estoque ao declinar pedido (incrementa).
 */
async function incrementStockForOrder(order: Order): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new InternalError("firebase_admin_not_initialized");

  const productsRef = db.collection("products");

  for (const item of order.items) {
    const docRef = productsRef.doc(item.productId);
    const snap = await docRef.get();
    if (!snap.exists) continue;

    const data = snap.data();
    if (!data) continue;

    const sizes = data.sizes as ProductSize[] | undefined;
    const stockBySize = data.stockBySize as Record<string, number> | undefined;
    const colorVariants = data.colorVariants as
      | Array<{ color: string; stockBySize?: Record<string, number> }>
      | undefined;
    const size = item.variants?.size as ProductSize | undefined;
    const color = item.variants?.color;

    const productLike = {
      stock: data.stock as number | undefined,
      sizes,
      stockBySize,
      colorVariants,
    };

    if (
      hasVariantLevelStock(productLike) &&
      color &&
      size &&
      sizes?.includes(size)
    ) {
      const idx = colorVariants?.findIndex((v) => v.color === color) ?? -1;
      if (idx < 0) continue;
      const cur = colorVariants?.[idx]?.stockBySize?.[size] ?? 0;
      const rootStock = (data.stock as number) ?? 0;
      const updates: Record<string, unknown> = {
        [`colorVariants.${idx}.stockBySize.${size}`]: cur + item.quantity,
        stock: rootStock + item.quantity,
        updatedAt: Timestamp.now(),
      };
      if (stockBySize && sizes?.includes(size)) {
        const aggCur = stockBySize[size] ?? 0;
        updates[`stockBySize.${size}`] = aggCur + item.quantity;
      }
      await docRef.update(updates);
    } else if (size && sizes?.includes(size) && stockBySize) {
      const current = stockBySize[size] ?? 0;
      await docRef.update({
        [`stockBySize.${size}`]: current + item.quantity,
        updatedAt: Timestamp.now(),
      });
    } else {
      const current = (data.stock as number) ?? 0;
      await docRef.update({
        stock: current + item.quantity,
        updatedAt: Timestamp.now(),
      });
    }
  }
}

/**
 * Gera uma planilha de auditoria com todos os pedidos e, em seguida,
 * apaga todos os pedidos do sistema. A exportação acontece antes da
 * exclusão e a partir do mesmo snapshot de dados: se a geração da
 * planilha falhar, nenhum pedido é apagado.
 */
export async function clearAllOrdersAction(): Promise<
  ActionResult<{ base64: string; fileName: string; deletedCount: number }>
> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const orders = await listAllOrders();
    if (orders.length === 0) {
      return { success: false, error: "Não há pedidos para limpar" };
    }

    const buffer = await generateOrdersAuditXlsxBuffer(orders);

    const ids = orders.map((o) => o.id).filter((id): id is string => !!id);
    const { deletedCount } = await deleteAllOrders(ids);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const fileName = `aurora-pedidos-backup-${timestamp}.xlsx`;

    return {
      success: true,
      data: {
        base64: buffer.toString("base64"),
        fileName,
        deletedCount,
      },
    };
  } catch (error) {
    const { message } = handleActionError(
      "clearAllOrdersAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}
