"use server";

import { Timestamp } from "firebase-admin/firestore";
import type {
  Order,
  OrderItem,
  OrderItemWithStock,
  OrderStatus,
  OrderWithStock,
} from "@/core/schemas/order.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import {
  getOrderById,
  listOrders,
  updateOrderStatus as repoUpdateStatus,
} from "@/infrastructure/repositories/firestore-order.repository";

export type OrderActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listOrdersAction(): Promise<OrderActionResult<Order[]>> {
  try {
    const orders = await listOrders();
    return { success: true, data: orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao listar pedidos",
    };
  }
}

/**
 * Lista pedidos enriquecidos com estoque atual de cada item.
 * Permite ao admin ver se há estoque suficiente antes de finalizar.
 */
export async function listOrdersWithStockAction(): Promise<
  OrderActionResult<OrderWithStock[]>
> {
  try {
    const orders = await listOrders();
    const enriched: OrderWithStock[] = [];

    const db = getAdminDb();
    if (!db) {
      return {
        success: true,
        data: orders.map((o) => ({
          ...o,
          items: o.items.map((i) => ({
            ...i,
            currentStock: 0,
            sufficient: false,
          })),
        })),
      };
    }

    const productsRef = db.collection("products");

    for (const order of orders) {
      const itemsWithStock: OrderItemWithStock[] = [];

      for (const item of order.items) {
        const doc = await productsRef.doc(item.productId).get();
        let currentStock = 0;

        if (doc.exists) {
          const data = doc.data()!;
          const size = item.variants?.size;
          const sizes = data.sizes as string[] | undefined;
          const stockBySize = data.stockBySize as
            | Record<string, number>
            | undefined;

          if (size && sizes?.includes(size) && stockBySize) {
            currentStock = stockBySize[size] ?? 0;
          } else {
            currentStock = (data.stock as number) ?? 0;
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

    return { success: true, data: enriched };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao listar pedidos",
    };
  }
}

export async function getOrderByIdAction(
  id: string,
): Promise<OrderActionResult<Order | null>> {
  try {
    const order = await getOrderById(id);
    return { success: true, data: order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar pedido",
    };
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
): Promise<OrderActionResult<Order>> {
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
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar status",
    };
  }
}

/**
 * Decrementa estoque dos produtos do pedido (ao finalizar).
 */
async function decrementStockForOrder(order: Order): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin não inicializado");

  const productsRef = db.collection("products");

  for (const item of order.items) {
    const docRef = productsRef.doc(item.productId);
    const snap = await docRef.get();
    if (!snap.exists) continue;

    const data = snap.data()!;
    const sizes = data.sizes as string[] | undefined;
    const stockBySize = data.stockBySize as Record<string, number> | undefined;
    const size = item.variants?.size;

    if (size && sizes?.includes(size) && stockBySize) {
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
  if (!db) throw new Error("Firebase Admin não inicializado");

  const productsRef = db.collection("products");

  for (const item of order.items) {
    const docRef = productsRef.doc(item.productId);
    const snap = await docRef.get();
    if (!snap.exists) continue;

    const data = snap.data()!;
    const sizes = data.sizes as string[] | undefined;
    const stockBySize = data.stockBySize as Record<string, number> | undefined;
    const size = item.variants?.size;

    if (size && sizes?.includes(size) && stockBySize) {
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
