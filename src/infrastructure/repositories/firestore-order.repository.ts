import { Timestamp } from "firebase-admin/firestore";
import type {
  Order,
  OrderItem,
  OrderStatus,
} from "@/core/schemas/order.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";

const COLLECTION = "orders";

function toDate(val: unknown): Date {
  if (val && typeof val === "object" && "toDate" in val) {
    return (val as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export async function createOrder(
  items: OrderItem[],
  total: number,
): Promise<Order> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin não inicializado");

  const now = new Date();
  const data = {
    items,
    total,
    status: "PENDENTE" as OrderStatus,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };

  const docRef = await db.collection(COLLECTION).add(data);

  return {
    id: docRef.id,
    items,
    total,
    status: "PENDENTE",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listOrders(): Promise<Order[]> {
  const db = getAdminDb();
  if (!db) return [];

  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      items: (d.items as OrderItem[]) || [],
      total: (d.total as number) || 0,
      status: (d.status as OrderStatus) || "PENDENTE",
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  });
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = getAdminDb();
  if (!db) return null;

  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  const d = doc.data()!;
  return {
    id: doc.id,
    items: (d.items as OrderItem[]) || [],
    total: (d.total as number) || 0,
    status: (d.status as OrderStatus) || "PENDENTE",
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  const db = getAdminDb();
  if (!db) return null;

  const now = new Date();
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({
      status,
      updatedAt: Timestamp.fromDate(now),
    });

  return getOrderById(id);
}
